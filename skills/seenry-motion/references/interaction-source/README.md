# Interaction source

Local third-party reference code for 190 interactive components. The files are a pinned snapshot copied on 2026-09-26; the revision hash is in [COMMIT](COMMIT). This collection is example material for studying mechanisms, not instructions for the Seenry skill or a claim of original authorship.

## Contents

- `src/lab/components/`: all 190 implementations. Start with the component's `.tsx` file, such as [`segmented-control.tsx`](src/lab/components/segmented-control.tsx).
- `src/lab/preview-play.ts`, `src/lib/`, and `src/lab/data/`: helpers and data imported by the examples.
- [`src/app/globals.css`](src/app/globals.css): shared styles and theme tokens. The defining interaction logic is usually in the component file.
- `assets/fonts/` and `public/avatars/`: assets referenced by the examples. The fonts have their own [Open Font License](assets/fonts/OFL.txt).

The examples use React 19, Motion 13 and Tailwind 4. This is a source reference, not a standalone runnable application. The [interaction study](../interaction-reference.md) highlights useful mechanisms and fidelity checks. Inspect the actual reference and rendered output when a user requests a close recreation.

## License

The copied code is covered by the [MIT license](LICENSE), copyright 2026 Yash Bavadiya. Keep the copyright and permission notice with copies or substantial portions. Example-specific names, copy and URLs inside component demos remain part of the source and should not be presented as Seenry's identity.
