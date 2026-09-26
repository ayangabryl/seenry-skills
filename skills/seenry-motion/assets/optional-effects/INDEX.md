# Local effect engine archives

These five public MIT package releases are bundled as optional local archives. Use them only when a selected effect needs that engine and the host project is compatible. The [effect decisions](../../references/expressive-effects.md) describe when each treatment is useful and what to verify. This directory contains package code, type declarations, package metadata and the original license notices; it does not include peer dependencies or paid presets.

| Treatment | Local archive | Required peer runtime |
| --- | --- | --- |
| Boundary light | [border-beam 1.3.0](border-beam-1.3.0.tgz) | React and React DOM 18+ |
| Process orb | [thinking-orbs 0.3.1](thinking-orbs-0.3.1.tgz) | React 18+ |
| Liquid grouping | [liquid-gooey 0.2.2](liquid-gooey-0.2.2.tgz) | React and React DOM 18+ |
| Reflective material | [metal-fx 2.0.10](metal-fx-2.0.10.tgz) | React and React DOM 18+ |
| Image reveal | [img-fx 0.5.1](img-fx-0.5.1.tgz) | React and React DOM 18+, Three 0.149+ |

The archive hashes and peer ranges are in [manifest.json](manifest.json). Keep the corresponding local `*-LICENSE` file when copying a package or substantial portion of its code; `metal-fx` also has a `*-NOTICE` file. Check the selected archive's package metadata and types before integrating it. In a compatible project, a package manager can install the archive by local file path. Peer packages must already be available or installed separately. Test the chosen effect in the actual application; bundling source does not establish browser support, accessibility or visual fidelity.
