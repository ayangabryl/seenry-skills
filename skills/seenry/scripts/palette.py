"""Generate an accessible OKLCH color system from one brand color, and measure it.

Python 3.9+, standard library only.

  python3 palette.py "#5b5bd6"                      # print CSS + contrast report
  python3 palette.py "#5b5bd6" --out tokens.css     # write the CSS
  python3 palette.py "#5b5bd6" --pin                # keep the brand hex exact on its nearest step
  python3 palette.py "#5b5bd6" --status              # add positive/warning/negative ramps
  python3 palette.py --check "#6b7280" "#ffffff"     # WCAG ratio + APCA Lc for one pair

Ramps have 11 steps (50–950): perceptually even lightness (denser at the light end), constant hue, chroma
peaking mid-ramp and falling off at both ends, gamut-mapped to sRGB by reducing chroma. Primitives are named
by hue; semantic tokens by role, for light and dark. Every text and control pair is measured.
"""
import argparse
import math
import re
import sys

STEPS = (50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950)
LIGHTNESS = (0.975, 0.935, 0.885, 0.81, 0.71, 0.625, 0.55, 0.49, 0.425, 0.375, 0.28)
CHROMA_SHAPE = (0.08, 0.18, 0.34, 0.56, 0.82, 1.0, 0.98, 0.9, 0.78, 0.62, 0.46)
# Neutrals need a much darker end than hues: dark-mode backgrounds live at 900 and 950.
NEUTRAL_LIGHTNESS = (0.985, 0.967, 0.922, 0.87, 0.708, 0.556, 0.442, 0.371, 0.269, 0.205, 0.145)


# --- conversions -----------------------------------------------------------------------------------------
def hex_to_rgb(value):
    value = value.strip().lstrip('#')
    if not re.fullmatch(r'[0-9a-fA-F]{3}|[0-9a-fA-F]{6}', value):
        raise SystemExit(f'Not a hex color: #{value}')
    if len(value) == 3:
        value = ''.join(c * 2 for c in value)
    return tuple(int(value[i:i + 2], 16) / 255 for i in (0, 2, 4))


def rgb_to_hex(rgb):
    return '#' + ''.join(f'{round(min(1, max(0, c)) * 255):02x}' for c in rgb)


def to_linear(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def from_linear(c):
    return 12.92 * c if c <= 0.0031308 else 1.055 * c ** (1 / 2.4) - 0.055


def rgb_to_oklch(rgb):
    r, g, b = (to_linear(c) for c in rgb)
    l = (0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b) ** (1 / 3)
    m = (0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b) ** (1 / 3)
    s = (0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b) ** (1 / 3)
    L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s
    a = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s
    bb = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s
    return L, math.hypot(a, bb), math.degrees(math.atan2(bb, a)) % 360


def oklch_to_linear(L, C, H):
    a, b = C * math.cos(math.radians(H)), C * math.sin(math.radians(H))
    l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
    m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
    s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3
    return (4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
            -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
            -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s)


def in_gamut(L, C, H):
    return all(-1e-4 <= c <= 1 + 1e-4 for c in oklch_to_linear(L, C, H))


def oklch_to_hex(L, C, H):
    lo, hi = 0.0, C
    if not in_gamut(L, C, H):  # reduce chroma until the color fits sRGB
        for _ in range(30):
            mid = (lo + hi) / 2
            lo, hi = (mid, hi) if in_gamut(L, mid, H) else (lo, mid)
        C = lo
    return rgb_to_hex([from_linear(max(0.0, c)) for c in oklch_to_linear(L, C, H)]), C


# --- contrast --------------------------------------------------------------------------------------------
def wcag(fg, bg):
    lum = lambda rgb: 0.2126 * to_linear(rgb[0]) + 0.7152 * to_linear(rgb[1]) + 0.0722 * to_linear(rgb[2])
    a, b = lum(hex_to_rgb(fg)), lum(hex_to_rgb(bg))
    return (max(a, b) + 0.05) / (min(a, b) + 0.05)


def apca(fg, bg):
    """APCA-W3 0.0.98G-4g Lc. Positive: dark text on light; negative: light text on dark."""
    y = lambda rgb: 0.2126729 * rgb[0] ** 2.4 + 0.7151522 * rgb[1] ** 2.4 + 0.0721750 * rgb[2] ** 2.4
    clamp = lambda v: v + (0.022 - v) ** 1.414 if v < 0.022 else v
    yt, yb = clamp(y(hex_to_rgb(fg))), clamp(y(hex_to_rgb(bg)))
    if abs(yb - yt) < 0.0005:
        return 0.0
    if yb > yt:
        s = (yb ** 0.56 - yt ** 0.57) * 1.14
        return 0.0 if s < 0.1 else (s - 0.027) * 100
    s = (yb ** 0.65 - yt ** 0.62) * 1.14
    return 0.0 if s > -0.1 else (s + 0.027) * 100


# --- ramps and roles -------------------------------------------------------------------------------------
def ramp(hex_value, chroma_scale=1.0, pin=False, neutral=False):
    L0, C0, H = rgb_to_oklch(hex_to_rgb(hex_value))
    anchor = min(STEPS, key=lambda s: abs(LIGHTNESS[STEPS.index(s)] - L0))
    achromatic = C0 < 0.02  # a gray or black brand has no meaningful hue
    if neutral:
        peak = 0.0 if achromatic else 0.012
    else:
        # Anchor the curve so the brand's own step keeps the brand's chroma; gamut mapping trims the rest.
        peak = 0.0 if achromatic else C0 / CHROMA_SHAPE[STEPS.index(anchor)] * chroma_scale
    out = {}
    for step, L, shape in zip(STEPS, NEUTRAL_LIGHTNESS if neutral else LIGHTNESS, CHROMA_SHAPE):
        out[step] = oklch_to_hex(L, peak * (0.35 + 0.65 * shape) if neutral else peak * shape, H)[0]
    if pin and not neutral:
        out[anchor] = rgb_to_hex(hex_to_rgb(hex_value))
    return out, anchor, (L0, C0, H)


def best_on(fill, light_text, dark_text):
    """Text color for a filled surface: whichever of the two reads with the higher APCA contrast."""
    return max((light_text, dark_text), key=lambda t: abs(apca(t, fill)))


def passes(fg, bg, kind):
    need_ratio, need_lc = THRESHOLDS[kind]
    return wcag(fg, bg) >= need_ratio and abs(apca(fg, bg)) >= need_lc


def pick(candidates, ok):
    return next((c for c in candidates if ok(c)), candidates[-1])


def semantic(accent, neutral, accent_anchor):
    ink_light, ink_dark = '#ffffff', neutral[950]
    # Keep the brand's own step as the solid fill when some text color passes on it; otherwise move inward.
    order = [accent_anchor] + [s for s in (500, 600, 400, 700, 300, 800) if s != accent_anchor]
    solid = pick(order, lambda s: passes(best_on(accent[s], ink_light, ink_dark), accent[s], 'label'))
    hover = STEPS[min(STEPS.index(solid) + 1, 10)] if best_on(accent[solid], ink_light, ink_dark) == ink_light else STEPS[max(STEPS.index(solid) - 1, 0)]
    light = {
        'bg': neutral[50], 'bg-surface': '#ffffff', 'bg-sunken': neutral[100], 'bg-hover': neutral[100],
        'text': neutral[950], 'text-secondary': pick([neutral[600], neutral[700]], lambda c: passes(c, '#ffffff', 'body')),
        'text-tertiary': pick([neutral[500], neutral[600]], lambda c: passes(c, '#ffffff', 'label')), 'text-disabled': neutral[400],
        'border': neutral[200], 'border-control': pick([neutral[400], neutral[500], neutral[600]], lambda c: passes(c, '#ffffff', 'ui')),
        'separator': neutral[200],
        'accent-subtle': accent[100], 'accent-border': accent[300], 'accent-solid': accent[solid], 'accent-solid-hover': accent[hover],
        'accent-text': pick([accent[600], accent[700], accent[800]], lambda c: passes(c, '#ffffff', 'label')),
        'on-accent': best_on(accent[solid], ink_light, ink_dark),
        'focus': pick([accent[500], accent[600], accent[700]], lambda c: passes(c, '#ffffff', 'ui')),
    }
    surface = neutral[900]
    dsolid = pick([400, 300, 500, 200], lambda s: passes(best_on(accent[s], ink_light, ink_dark), accent[s], 'label'))
    dark = {
        'bg': neutral[950], 'bg-surface': surface, 'bg-sunken': neutral[950], 'bg-hover': neutral[800],
        'text': neutral[50], 'text-secondary': pick([neutral[300], neutral[200], neutral[100]], lambda c: passes(c, surface, 'body')),
        'text-tertiary': pick([neutral[400], neutral[300]], lambda c: passes(c, surface, 'label')), 'text-disabled': neutral[600],
        'border': neutral[800], 'border-control': pick([neutral[600], neutral[500], neutral[400]], lambda c: passes(c, surface, 'ui')),
        'separator': neutral[800],
        'accent-subtle': accent[950], 'accent-border': accent[800], 'accent-solid': accent[dsolid],
        'accent-solid-hover': accent[STEPS[max(STEPS.index(dsolid) - 1, 0)]],
        'accent-text': pick([accent[300], accent[200], accent[100]], lambda c: passes(c, surface, 'label')),
        'on-accent': best_on(accent[dsolid], ink_light, ink_dark),
        'focus': pick([accent[400], accent[300], accent[200]], lambda c: passes(c, surface, 'ui')),
    }
    return light, dark


PAIRS = (('text', 'bg', 'body'), ('text', 'bg-surface', 'body'), ('text-secondary', 'bg-surface', 'body'),
         ('text-tertiary', 'bg-surface', 'label'), ('accent-text', 'bg-surface', 'label'),
         ('on-accent', 'accent-solid', 'label'), ('on-accent', 'accent-solid-hover', 'label'),
         ('border-control', 'bg-surface', 'ui'), ('focus', 'bg-surface', 'ui'))
THRESHOLDS = {'body': (4.5, 75), 'label': (4.5, 60), 'ui': (3.0, 30)}


def report(theme, name):
    rows, fails = [], 0
    for fg, bg, kind in PAIRS:
        ratio, lc = wcag(theme[fg], theme[bg]), abs(apca(theme[fg], theme[bg]))
        need_ratio, need_lc = THRESHOLDS[kind]
        ok = ratio >= need_ratio and lc >= need_lc
        fails += not ok
        rows.append(f"  {'ok  ' if ok else 'FAIL'} {name:5} {fg:18} on {bg:12} {ratio:5.2f}:1 (≥{need_ratio})  Lc {lc:5.1f} (≥{need_lc})")
    return rows, fails


def css(ramps, light, dark):
    lines = [':root {', '  color-scheme: light dark;', '  /* Primitives: named by hue. Never used directly in components. */']
    for name, values in ramps.items():
        lines += [f'  --{name}-{s}: {v};' for s, v in values.items()]
    lines.append('  /* Semantic roles: the only tier components use. */')
    lines += [f'  --color-{k}: {v};' for k, v in light.items()]
    lines.append('}')
    lines += ['@media (prefers-color-scheme: dark) {', '  :root:not([data-theme="light"]) {']
    lines += [f'    --color-{k}: {v};' for k, v in dark.items()]
    lines += ['  }', '}', ':root[data-theme="dark"] {'] + [f'  --color-{k}: {v};' for k, v in dark.items()] + ['}']
    return '\n'.join(lines) + '\n'


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument('brand', nargs='?')
    p.add_argument('--name', default='accent', help='primitive name for the brand ramp (default accent)')
    p.add_argument('--pin', action='store_true', help='keep the exact brand hex on its nearest step')
    p.add_argument('--status', action='store_true', help='add positive, warning and negative ramps')
    p.add_argument('--out')
    p.add_argument('--check', nargs=2, metavar=('FG', 'BG'))
    a = p.parse_args(argv)
    if a.check:
        fg, bg = a.check
        print(f'WCAG {wcag(fg, bg):.2f}:1   APCA Lc {apca(fg, bg):.1f}')
        return 0
    if not a.brand:
        p.error('give a brand hex, or --check FG BG')
    accent, anchor, (L0, C0, H) = ramp(a.brand, pin=a.pin)
    neutral, _, _ = ramp(a.brand, neutral=True)
    ramps = {a.name: accent, 'neutral': neutral}
    if a.status:
        for name, hue_hex in (('positive', '#16a34a'), ('warning', '#d97706'), ('negative', '#dc2626')):
            ramps[name] = ramp(hue_hex)[0]
    light, dark = semantic(accent, neutral, anchor)
    text = css(ramps, light, dark)
    if a.out:
        open(a.out, 'w', encoding='utf-8').write(text)
    else:
        print(text)
    print(f'/* brand {a.brand}: oklch({L0:.3f} {C0:.3f} {H:.1f}) nearest step {a.name}-{anchor}{" (pinned)" if a.pin else ""} */', file=sys.stderr)
    fails = 0
    for theme, name in ((light, 'light'), (dark, 'dark')):
        rows, f = report(theme, name)
        fails += f
        print('\n'.join(rows), file=sys.stderr)
    print(f'{fails} failing pair(s).' if fails else 'All measured pairs pass WCAG AA and APCA targets.', file=sys.stderr)
    return 1 if fails else 0


if __name__ == '__main__':
    sys.exit(main())
