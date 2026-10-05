"""Check actual opaque sRGB foreground/background pairs without a browser.

Usage: python3 contrast_check.py --pair "Muted on paper" '#647267' '#F5F1E7' 4.5
For alpha, gradients, images or inherited/composited colors, inspect the rendered page.
"""
import argparse
import json

from color_lab import color, contrast


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--pair', nargs=4, action='append', required=True,
                        metavar=('LABEL', 'FOREGROUND', 'BACKGROUND', 'MINIMUM'))
    args = parser.parse_args()
    checks = []
    try:
        for label, foreground, background, raw_minimum in args.pair:
            minimum = float(raw_minimum)
            if not label.strip() or not 0 < minimum <= 21:
                raise ValueError('Each pair needs a label and a minimum between 0 and 21.')
            foreground, background = color(foreground), color(background)
            ratio = contrast(foreground, background)
            checks.append({'label': label, 'foreground': foreground, 'background': background,
                           'ratio': round(ratio, 3), 'minimum': minimum, 'pass': ratio >= minimum})
    except ValueError as error:
        parser.exit(1, f'{error}\n')
    print(json.dumps({'scope': 'Opaque sRGB pairs only; not a page audit or visual-quality score',
                      'checks': checks}, indent=2))
    if not all(item['pass'] for item in checks):
        parser.exit(2, 'Review required: at least one pair failed.\n')


if __name__ == '__main__':
    main()
