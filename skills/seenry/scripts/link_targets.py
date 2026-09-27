#!/usr/bin/env python3
"""Check that a screenshot reconstruction does not ship dead or unverified links."""

import argparse
import json
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = set()
        self.links = []

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if values.get("id"):
            self.ids.add(values["id"])
        if tag == "a":
            self.links.append((self.getpos()[0], values.get("href")))


def inspect(path, known):
    parser = Links()
    parser.feed(Path(path).read_text(encoding="utf-8"))
    findings = []
    for line, href in parser.links:
        if href is None or not href.strip():
            findings.append({"line": line, "href": href, "reason": "missing destination"})
            continue
        if href in known:
            continue
        parsed = urlsplit(href)
        if not parsed.scheme and not parsed.netloc and not parsed.path and parsed.fragment:
            if unquote(parsed.fragment) not in parser.ids:
                findings.append({"line": line, "href": href, "reason": "fragment target absent"})
        elif parsed.scheme == "javascript":
            findings.append({"line": line, "href": href, "reason": "script URL is not a destination"})
        else:
            findings.append({"line": line, "href": href, "reason": "destination needs source evidence"})
    return findings


def main():
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument("html", help="Local reconstructed HTML file")
    cli.add_argument("--known", action="append", default=[], help="Exact href verified from source behavior or supplied facts")
    cli.add_argument("--json", action="store_true", help="Print machine-readable findings")
    args = cli.parse_args()
    findings = inspect(args.html, set(args.known))
    if args.json:
        print(json.dumps({"file": args.html, "findings": findings}, indent=2))
    else:
        for item in findings:
            print(f"{args.html}:{item['line']}: {item['reason']}: {item['href']!r}")
        print(f"{len(findings)} link target(s) need repair or verified evidence.")
    raise SystemExit(1 if findings else 0)


if __name__ == "__main__":
    main()
