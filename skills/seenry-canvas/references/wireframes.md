# Studio speed: map and wireframes

Use only when the person asks for wireframes or a full design process. Studio adds two rounds before step 4 of the workflow, and a prototype round after step 5.

| Stage | On the canvas | The person decides |
| --- | --- | --- |
| `map` | One titled screen per screen in the list, in flow order | Are these the right screens and flows? |
| `wireframe` | Every screen in the wireframe kit with real copy, options only on open decisions | Structure and flow |
| `look` | Foundations and two or three key screens in two visual treatments | The look |
| `mockup` | Component sheets, then every screen in the picked look | Each screen at full fidelity |
| `prototype` | The same screens linked, so Present plays every flow | Does it work in use? |
| `build` | The built screens beside the approved ones | Sign-off |

Set `stage` in `canvas.json` and move it forward only when the person has approved the current stage.

## The wireframe kit

A wireframe links `../wire.css` and uses plain HTML with its classes. No brand color, no chosen typeface and no images, so the person judges structure alone.

| Class | Use |
| --- | --- |
| `wf-wrap`, `wf-section`, `wf-nav` | Page width, a section, the header |
| `wf-stack`, `wf-row`, `wf-cols` (`--cols`), `wf-split` (`--a`, `--b`) | Layout |
| `wf-img`, `wf-ui` (`--ratio`) | A photograph or a product view, with its subject written inside |
| `wf-btn`, `wf-btn quiet` | The main action, a secondary one |
| `wf-big`, `wf-muted`, `wf-small`, `wf-dark`, `wf-box`, `wf-rule` | Emphasis and grouping |
| `wf-note` | A note to the reviewer, never part of the design |

- Real copy, labels and numbers. Lorem ipsum hides the problems a wireframe exists to show.
- Inside each `wf-img` and `wf-ui`, say what it will be: "Photo: the oven at 4 am", not "Image".
- Link the screens, so the flow is clickable from the first round.
- Keep a wireframe under about 80 lines.
