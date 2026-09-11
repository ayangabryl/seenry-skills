# Motion capability lab

A host-authored integration study for the five public libraries.dev packages. This is not a model-generated product, a landing-page template or proof of visual quality. Read the [decision study](../../skills/seenry-motion/references/libraries-dev.md) before adopting an effect.

From this directory, with Node/npm and Python available:

```sh
npm ci --ignore-scripts
npm run build
python -m http.server 8840 --bind 127.0.0.1
```

Open `http://127.0.0.1:8840`. The packages are pinned in the lockfile. Inspect their MIT licenses in `node_modules`; retain the generated `bundle.js.LEGAL.txt` when distributing a bundle. The image is public-domain Met Open Access material; see `asset-manifest.json`. The package identity, integrity and inspected type hashes are recorded in `package-study.json`.

Try the nine orb states, three liquid behaviors, three image presets, pause, reduced motion, the explicit GPU fallback and unmount/remount. The host combines the user setting, reduced-motion preference, page visibility and intersection visibility. It does not rely on a catalog-wide accessibility claim. The liquid controls retain their DOM identities when motion policy changes, and collapsed actions cannot receive focus or intercept clicks.

The initial local study used macOS Chromium with SwiftShader, actual screenshots and a recording. Software rendering cannot establish hardware frame budgets. An explicit fallback toggle is not a test of context-loss recovery. Safari, Firefox, native mobile builds and every vendor preset remain unverified. The example's back-link assumes the repository is served from its root; when serving only this directory, open the Markdown guide directly.

Run the reproducible browser checks against a local server:

```sh
npm install --no-save --package-lock=false playwright@1.63.0
npx playwright install chromium
node verify.mjs --url http://127.0.0.1:8840/ --playwright ./node_modules/playwright/index.mjs
```

The generated evidence report separates checks from limitations. The packages stay optional: installing Seenry itself does not download these libraries or require MCP, React or WebGL.

The [recorded verification snapshot](verification.json) contains 16 passing checks for the pinned source, with source hashes and limits. Re-run the checks after changing the integration; the snapshot is not a certificate for every use of these packages.
