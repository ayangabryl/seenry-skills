#!/usr/bin/env python3
"""Pack quiescent native evidence into independently retrievable, lossless ZIPs.

Python 3.9+; no dependencies. Requires POSIX descriptor-relative, no-follow I/O
(macOS/Linux). Unsupported platforms fail closed. The source is never modified.
Every part is at most 23 MiB including ZIP headers, reserving at least 1 MiB of
an upload's 24 MiB budget for its outer envelope. Upload parts separately.
A complete manifest means the final source and archive checks both passed; it
is not a filesystem snapshot or a lock against changes after verification.
"""

import argparse
import contextlib
import hashlib
import json
import os
from pathlib import Path
import stat
import sys
import zipfile
from dataclasses import dataclass

MIB = 1024 * 1024
MAX_PART_BYTES = 23 * MIB
MAX_INPUT_BYTES = 128 * MIB
MAX_FILES = 4096
MAX_PARTS = 8
MAX_DIRECTORIES = 4096
MAX_PATH_BYTES = 1024
MAX_DEPTH = 64
CHUNK_BYTES = 1024 * 1024


class PackError(Exception):
    """Evidence cannot safely be declared complete."""


@dataclass(frozen=True)
class Limits:
    part_bytes: int = MAX_PART_BYTES
    input_bytes: int = MAX_INPUT_BYTES
    files: int = MAX_FILES
    parts: int = MAX_PARTS
    directories: int = MAX_DIRECTORIES

    def validate(self):
        for name, maximum in (("part_bytes", MAX_PART_BYTES),
                              ("input_bytes", MAX_INPUT_BYTES),
                              ("files", MAX_FILES), ("parts", MAX_PARTS),
                              ("directories", MAX_DIRECTORIES)):
            value = getattr(self, name)
            if type(value) is not int or not 1 <= value <= maximum:
                raise PackError(f"{name} must be between 1 and {maximum}")
        if self.part_bytes < 22:
            raise PackError("part_bytes is too small for a ZIP end record")


def supported_platform():
    return (os.name == "posix" and hasattr(os, "O_NOFOLLOW")
            and os.open in os.supports_dir_fd and os.scandir in os.supports_fd)


def signature(st):
    return (st.st_dev, st.st_ino, st.st_mode, st.st_size,
            st.st_mtime_ns, st.st_ctime_ns, st.st_nlink)


def safe_path(path):
    if (not path or path.startswith("/") or "\\" in path or ":" in path
            or any(p in ("", ".", "..") for p in path.split("/"))
            or any(ord(c) < 32 or ord(c) == 127 for c in path)):
        raise PackError(f"unsafe relative path: {path!r}")
    try:
        encoded = path.encode("utf-8")
    except UnicodeError as exc:
        raise PackError(f"path is not valid UTF-8: {path!r}") from exc
    if len(encoded) > MAX_PATH_BYTES or len(path.split("/")) > MAX_DEPTH:
        raise PackError(f"path exceeds length/depth budget: {path!r}")


def open_directory(path, *, dir_fd=None):
    return os.open(path, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW,
                   dir_fd=dir_fd)


def open_absolute_directory(path, *, create=False):
    """Open each component without following links, including path ancestors."""
    fd = open_directory(path.anchor)
    try:
        for component in path.parts[1:]:
            if create:
                try:
                    os.mkdir(component, 0o755, dir_fd=fd)
                except FileExistsError:
                    pass
            child = open_directory(component, dir_fd=fd)
            os.close(fd)
            fd = child
        return fd
    except BaseException:
        os.close(fd)
        raise


class SourceTree:
    def __init__(self, source):
        self.source = source
        self.fd = open_absolute_directory(source)
        self.signatures = {"": signature(os.fstat(self.fd))}

    def close(self):
        os.close(self.fd)

    def scan(self, limits, inventory):
        """Bound the traversal before hashing; retain partial inventory on error."""
        snapshots = {"": signature(os.fstat(self.fd))}
        counts = {"file": 0, "directory": 0, "bytes": 0}

        def visit(fd, prefix):
            # Limit materialization too: a hostile directory cannot grow memory
            # before the overall inventory budget is applied.
            names = []
            with os.scandir(fd) as entries:
                for entry in entries:
                    names.append(entry.name)
                    if len(names) > limits.files + limits.directories:
                        raise PackError("directory entry budget exceeded")
            for name in sorted(names):
                relative = prefix + name
                safe_path(relative)
                st = os.stat(name, dir_fd=fd, follow_symlinks=False)
                if stat.S_ISLNK(st.st_mode):
                    raise PackError(f"symlink rejected: {relative}")
                if stat.S_ISREG(st.st_mode):
                    kind, size = "file", st.st_size
                elif stat.S_ISDIR(st.st_mode):
                    kind, size = "directory", 0
                else:
                    raise PackError(f"special file rejected: {relative}")
                counts[kind] += 1
                maximum = limits.files if kind == "file" else limits.directories
                if counts[kind] > maximum:
                    raise PackError(f"{kind} count budget exceeded")
                counts["bytes"] += size
                if counts["bytes"] > limits.input_bytes:
                    raise PackError("total input byte budget exceeded")
                snapshots[relative] = signature(st)
                inventory.append({"path": relative, "type": kind,
                                  "size_bytes": size, "sha256": None,
                                  "part": None})
                if kind == "directory":
                    child = open_directory(name, dir_fd=fd)
                    try:
                        if signature(os.fstat(child)) != signature(st):
                            raise PackError(f"source changed: {relative}")
                        visit(child, relative + "/")
                        if signature(os.fstat(child)) != signature(st):
                            raise PackError(f"source changed: {relative}")
                    finally:
                        os.close(child)
            if signature(os.fstat(fd)) != snapshots[prefix.rstrip("/")]:
                raise PackError(f"source directory changed: {prefix or '.'}")

        visit(self.fd, "")
        inventory.sort(key=lambda entry: entry["path"])
        if not counts["file"]:
            raise PackError("source contains no regular files")
        return snapshots

    @contextlib.contextmanager
    def open_file(self, entry):
        relative = entry["path"]
        parent = os.dup(self.fd)
        file_fd = None
        try:
            prefix = ""
            for component in relative.split("/")[:-1]:
                prefix = prefix + "/" + component if prefix else component
                child = open_directory(component, dir_fd=parent)
                os.close(parent)
                parent = child
                if signature(os.fstat(parent)) != self.signatures[prefix]:
                    raise PackError(f"source directory changed: {prefix}")
            file_fd = os.open(relative.split("/")[-1],
                              os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK,
                              dir_fd=parent)
            if signature(os.fstat(file_fd)) != self.signatures[relative]:
                raise PackError(f"source changed before read: {relative}")
            with os.fdopen(file_fd, "rb") as stream:
                file_fd = None
                yield stream
                if signature(os.fstat(stream.fileno())) != self.signatures[relative]:
                    raise PackError(f"source changed during read: {relative}")
        finally:
            if file_fd is not None:
                os.close(file_fd)
            os.close(parent)

    def read_file(self, entry, sink=None):
        digest, total = hashlib.sha256(), 0
        with self.open_file(entry) as stream:
            while True:
                block = stream.read(min(CHUNK_BYTES, entry["size_bytes"] - total + 1))
                if not block:
                    break
                total += len(block)
                if total > entry["size_bytes"]:
                    raise PackError(f"source grew during read: {entry['path']}")
                digest.update(block)
                if sink is not None:
                    sink.write(block)
        if total != entry["size_bytes"]:
            raise PackError(f"source size changed: {entry['path']}")
        return digest.hexdigest()

    def verify(self, limits, inventory):
        for entry in inventory:
            if entry["type"] == "file" and self.read_file(entry) != entry["sha256"]:
                raise PackError(f"final source hash mismatch: {entry['path']}")
        self.verify_inventory(limits)

    def verify_inventory(self, limits):
        if signature(os.lstat(self.source)) != self.signatures[""]:
            raise PackError("source root changed")
        if self.scan(limits, []) != self.signatures:
            raise PackError("source inventory changed")


def zip_name(entry):
    return entry["path"] + ("/" if entry["type"] == "directory" else "")


def zip_entry_bytes(entry):
    return 76 + 2 * len(zip_name(entry).encode("utf-8")) + entry["size_bytes"]


def plan_parts(inventory, limits):
    groups, current, size = [], [], 22
    for entry in inventory:
        added = zip_entry_bytes(entry)
        if added + 22 > limits.part_bytes:
            raise PackError(f"individual entry exceeds part byte budget: {entry['path']}")
        if current and size + added > limits.part_bytes:
            groups.append(current)
            current, size = [], 22
        current.append(entry)
        size += added
    if current:
        groups.append(current)
    if len(groups) > limits.parts:
        raise PackError("part count budget exceeded")
    for index, group in enumerate(groups):
        for entry in group:
            entry["part"] = f"part-{index:03d}.zip"
    return groups


def new_zip_info(entry):
    info = zipfile.ZipInfo(zip_name(entry), date_time=(1980, 1, 1, 0, 0, 0))
    info.compress_type = zipfile.ZIP_STORED
    info.create_system = 3
    info.external_attr = ((stat.S_IFDIR | 0o755) << 16 | 0x10
                          if entry["type"] == "directory"
                          else (stat.S_IFREG | 0o644) << 16)
    info.file_size = entry["size_bytes"]
    return info


def write_part(tree, out_fd, name, entries):
    fd = os.open(name, os.O_RDWR | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW,
                 0o600, dir_fd=out_fd)
    with os.fdopen(fd, "w+b") as output:
        with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_STORED,
                             allowZip64=False) as archive:
            for entry in entries:
                with archive.open(new_zip_info(entry), "w") as destination:
                    if entry["type"] == "file":
                        actual = tree.read_file(entry, destination)
                        if actual != entry["sha256"]:
                            raise PackError(f"source hash changed: {entry['path']}")
        output.flush()
        os.fsync(output.fileno())


def describe_part(out_fd, name):
    fd = os.open(name, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK, dir_fd=out_fd)
    with os.fdopen(fd, "rb") as stream:
        st = os.fstat(stream.fileno())
        if not stat.S_ISREG(st.st_mode) or st.st_size > MAX_PART_BYTES:
            raise PackError(f"invalid retained part: {name}")
        digest, total = hashlib.sha256(), 0
        for block in iter(lambda: stream.read(CHUNK_BYTES), b""):
            total += len(block)
            if total > st.st_size:
                raise PackError(f"part grew during verification: {name}")
            digest.update(block)
        if total != st.st_size or signature(os.fstat(stream.fileno())) != signature(st):
            raise PackError(f"part changed during verification: {name}")
    return {"size_bytes": st.st_size, "sha256": digest.hexdigest()}


def verify_part(out_fd, record, entries, limits):
    fd = os.open(record["name"], os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK,
                 dir_fd=out_fd)
    with os.fdopen(fd, "rb") as stream:
        expected_size = 22 + sum(zip_entry_bytes(entry) for entry in entries)
        if not os.fstat(stream.fileno()).st_size == expected_size <= limits.part_bytes:
            raise PackError(f"archive size/budget mismatch: {record['name']}")
        with zipfile.ZipFile(stream) as archive:
            if archive.namelist() != [zip_name(entry) for entry in entries]:
                raise PackError(f"archive inventory mismatch: {record['name']}")
            for entry, info in zip(entries, archive.infolist()):
                if (info.compress_type != zipfile.ZIP_STORED
                        or info.file_size != entry["size_bytes"]
                        or info.extra or info.comment or info.flag_bits & 1):
                    raise PackError(f"archive entry metadata mismatch: {entry['path']}")
                digest = hashlib.sha256()
                with archive.open(info) as member:
                    for block in iter(lambda: member.read(CHUNK_BYTES), b""):
                        digest.update(block)
                expected = entry["sha256"] if entry["type"] == "file" else hashlib.sha256(b"").hexdigest()
                if digest.hexdigest() != expected:
                    raise PackError(f"archive hash mismatch: {entry['path']}")
    actual = describe_part(out_fd, record["name"])
    if any(actual[key] != record[key] for key in actual):
        raise PackError(f"archive changed: {record['name']}")
    record["verified"] = True


def prepare_output(source, out):
    # Resolving locations establishes overlap, not permission to traverse tree links.
    try:
        source_real, out_real = source.resolve(), out.resolve()
    except RuntimeError as exc:
        raise PackError(f"cannot safely resolve source/output paths: {exc}") from exc
    if (source_real == out_real or source_real in out_real.parents
            or out_real in source_real.parents):
        raise PackError("source and output directories overlap")
    if out.is_symlink():
        raise PackError("output symlink rejected")
    fd = open_absolute_directory(out, create=True)
    try:
        with os.scandir(fd) as entries:
            if next(entries, None) is not None:
                raise PackError("output directory is not empty; nothing was overwritten")
    except BaseException:
        os.close(fd)
        raise
    return fd


def write_manifest(out_fd, manifest, *, staging_name=".manifest.pending.json"):
    data = (json.dumps(manifest, indent=2, sort_keys=True, ensure_ascii=False) + "\n").encode("utf-8")
    # Exclusive creation preserves any pre-existing or concurrently-created file.
    fd = os.open(staging_name, os.O_RDWR | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW,
                 0o600, dir_fd=out_fd)
    with os.fdopen(fd, "w+b") as output:
        output.write(data)
        output.flush()
        os.fsync(output.fileno())
        output.seek(0)
        if output.read() != data:
            raise PackError("manifest write verification failed")
    # Linking is atomic and cannot replace an existing manifest. Keep the staged
    # copy as well: error handling never removes any source or output data.
    os.link(staging_name, "manifest.json", src_dir_fd=out_fd, dst_dir_fd=out_fd,
            follow_symlinks=False)


def pack(source, out, *, limits=None):
    limits = limits or Limits()
    manifest = {"schema_version": 1, "status": "failed", "complete": False,
                "inventory_complete": False, "source_verified": False,
                "archives_verified": False, "error": None,
                "limits": vars(limits), "inventory": [], "parts": []}
    tree, out_fd = None, None
    try:
        if not supported_platform():
            raise PackError("packing requires POSIX no-follow descriptor-relative I/O (macOS/Linux)")
        source, out = Path(os.path.abspath(source)), Path(os.path.abspath(out))
        out_fd = prepare_output(source, out)
        limits.validate()
        tree = SourceTree(source)
        tree.signatures = tree.scan(limits, manifest["inventory"])
        manifest["inventory_complete"] = True
        for entry in manifest["inventory"]:
            if entry["type"] == "file":
                entry["sha256"] = tree.read_file(entry)
        groups = plan_parts(manifest["inventory"], limits)
        for index, entries in enumerate(groups):
            record = {"name": f"part-{index:03d}.zip", "written": False,
                      "verified": False, "size_bytes": None, "sha256": None,
                      "paths": [entry["path"] for entry in entries]}
            manifest["parts"].append(record)
            write_part(tree, out_fd, record["name"], entries)
            record.update(describe_part(out_fd, record["name"]))
            record["written"] = True
        tree.verify(limits, manifest["inventory"])
        manifest["source_verified"] = True
        for record, entries in zip(manifest["parts"], groups):
            verify_part(out_fd, record, entries, limits)
        tree.verify_inventory(limits)
        manifest["archives_verified"] = True
        manifest.update(status="complete", complete=True)
    except (OSError, ValueError, PackError, zipfile.BadZipFile, zipfile.LargeZipFile) as exc:
        manifest.update(status="failed", complete=False, error=f"{type(exc).__name__}: {exc}")
        if out_fd is not None:
            for record in manifest["parts"]:
                try:
                    record.update(describe_part(out_fd, record["name"]))
                except (OSError, PackError) as retained_error:
                    record["retained_error"] = str(retained_error)
    finally:
        if tree is not None:
            tree.close()
    try:
        if out_fd is not None:
            write_manifest(out_fd, manifest)
    except (OSError, ValueError, PackError) as exc:
        manifest.update(status="failed", complete=False, error=f"manifest could not be saved: {exc}")
        try:
            write_manifest(out_fd, manifest, staging_name=".manifest.failed.json")
        except (OSError, ValueError, PackError):
            pass  # An unavailable/occupied output cannot safely hold a manifest.
    finally:
        if out_fd is not None:
            os.close(out_fd)
    return manifest


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--out", required=True, type=Path)
    parser.add_argument("--part-bytes", type=int, default=MAX_PART_BYTES)
    args = parser.parse_args(argv)
    manifest = pack(args.source, args.out, limits=Limits(part_bytes=args.part_bytes))
    if not manifest["complete"]:
        print(f"native evidence packing failed: {manifest['error']}", file=sys.stderr)
        return 1
    print(f"Packed {sum(e['type'] == 'file' for e in manifest['inventory'])} files "
          f"into {len(manifest['parts'])} verified parts")
    return 0


if __name__ == "__main__":
    sys.exit(main())
