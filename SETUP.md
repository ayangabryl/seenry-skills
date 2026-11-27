# Set up Seenry

Paste this into your coding agent (Claude Code, Codex, Cursor, Antigravity, Kimi Code, VS Code and about 70 more). It installs Seenry’s 13 skills and the companion design skills by Emil Kowalski, Jakub Antalik and Jakub Krehel from their own repositories for every agent on the computer, not only the one you paste into. It opens the canvas, links your account, tells each agent to load Seenry whenever you mention it, and connects the reference library to each agent. Everything the agent needs is in the prompt.

Signed in on [seenry.design](https://seenry.design/app/setup)? Copy the prompt there instead: it carries a one-time code, so linking needs no approval.

```text
Set up Seenry so you can design in this project. Everything you need is in this message: run the commands below and do not open seenry.design.
1. Install Seenry’s skills: npx skills add ayangabryl/seenry-skills -g -y
2. Start the canvas: check that Node 18 or newer is installed, then run node ~/.agents/skills/seenry-canvas/scripts/canvas.mjs init and node ~/.agents/skills/seenry-canvas/scripts/canvas.mjs open, and show me the canvas.
3. Link this computer to my Seenry account: run node ~/.agents/skills/seenry-canvas/scripts/canvas.mjs link --start and give me the link and the code it prints straight away. I approve it in my browser.
4. While I approve the link, run npm i -D playwright and npx playwright install chromium so the canvas can render screens.
5. Finish the link: run node ~/.agents/skills/seenry-canvas/scripts/canvas.mjs link --finish (it waits up to 90 seconds). If it says it is not approved yet, ask me to approve, then run it again.
6. Connect Seenry to every agent on this computer: run node ~/.agents/skills/seenry-canvas/scripts/canvas.mjs library and tell me its one line per agent. It first writes Seenry's always-on instructions into each agent's own instruction file, so any agent loads Seenry when I mention it; that part needs no account. Then it adds the reference library, which needs Seenry Pro and a finished link; if it reports no key, or that this computer is not linked, skip only that part. For any agent it could not set up, do the step it prints. Never show me the key or write it into this project.
7. Install the companion design skills Seenry works with (29 skills by Emil Kowalski, Jakub Antalik and Jakub Krehel, from their own repositories). Run each command; if one fails, carry on and tell me at the end:
   npx skills add emilkowalski/skills -g -y --skill animate choreograph review-animations improve-animations find-animation-opportunities remove-animations animation-performance animation-vocabulary gestures animate-expo mobile-native apple-design write-swift prototype break-ui pick-ui-library emil-design-eng learn-taste ask-emil ask-sonner
   npx skills add Jakubantalik/transitions.dev -g -y --skill transitions-dev transitions-polish
   npx skills add Jakubantalik/Libraries.dev -g -y --skill libraries-dev
   npx skills add jakubkrehel/skills -g -y --skill better-typography better-colors better-layout better-accessibility better-writing better-ui
8. Check that the seenry skill is listed, and tell me how many of the 42 design skills are installed.
Then ask me what I want to design.
```

## Update

Paste this into any agent. It updates Seenry and the companion skills for every agent on the computer, and restarts the canvas if it is open.

```text
Update Seenry: run node ~/.agents/skills/seenry-canvas/scripts/canvas.mjs update and tell me what changed. If it prints a usage line instead (Seenry older than 3.8.0), run npx skills update -g -y, then the same canvas.mjs update command again. If it did not print an "Always-on instructions" section (Seenry older than 3.9.0 runs the old update code once), run node ~/.agents/skills/seenry-canvas/scripts/canvas.mjs library too. Then tell me to start a new session so you load the new skills.
```

The companion skills are not part of Seenry and are not affiliated with it; each installs under its author’s own licence.
