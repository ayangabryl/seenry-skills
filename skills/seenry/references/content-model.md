# Resolve information before arranging rectangles

Use this at the first unresolved composition decision. A style name does not specify an interface. Work from the person's object, choices and result, then draw their relationships. Keep this working model in DESIGN.md; it is not visitor-facing copy.

## Start with an information inventory

For each proposed visible element, record its actual content, role and when the person needs it. Use roles such as object identity, decision, result, action, explanation or recovery. Mark information already supplied by the host. Mark model-invented positioning as a hypothesis. Do not design a box for every fact in a technical brief.

For repeated information, distinguish its jobs. A selected size inside a choice and the resulting aspect ratio can communicate different things; two output summaries giving the same dimensions usually do not. A navigation destination may need more than one route. A visible label and its accessible name are not visual duplication. Do not hide essential labels to achieve a low text count.

Assign each fact a place: visible now, available on request, announced when it changes, inherited from the host, or unnecessary to the task. Give a short reason only for consequential choices. Frequent choices belong on the main path. Rare details can be disclosed through an obvious control. A two-option selector does not automatically need a menu, wizard or numbered steps.

## Give the material a job and a scale

An image can identify an object, support close inspection, be manipulated, prove a result, or establish atmosphere. Those jobs require different space. An identification image in a settings utility does not automatically need the scale of an art portfolio. A crop editor needs enough image area to manipulate accurately; a typography specimen may make text itself the main material. Set the scale from what the person must see or do. Avoid a universal image-first or text-first template.

Name the decision that needs enlarged detail. If the person only needs to recognize which file is selected, begin with identification-scale material and consider optional inspection. If a crop, brush or visual comparison is the operation, allocate space for that manipulation. “The image is the subject” alone does not establish a need for a large preview. An intentionally immersive viewing experience is a different task.

Sketch the main path at its actual containing size. Put the object, relevant choices, result and action into that space before adding an introduction. Record a provisional footprint and the anchor that must remain visible during the important change. Test narrow reflow with real label lengths. A larger composition can be appropriate; explain what the added space enables instead of filling the viewport by default.

## Compare relationships, not theme names

Describe each alternative using a spatial or behavioral difference: what stays together, what becomes directly manipulable, what can be compared at once, and what is disclosed. Keep the same facts and required capabilities. If only color or font changes, label it a surface study. If all alternatives put the same tall image above the same form, they do not test different task structures.

Before surface work, compare the actual render with this inventory. Identify any newly added headline, status, step label, accent, border or region and the information it contributes. Keep legitimate additions. When a repeated element has no distinct job, render a subtraction variant and check that discoverability, grouping and state remain clear. Do not advance merely because one option is less weak than the others.

Typography is part of this decision: use actual copy, weight and line breaks in the type checkpoint. Sentence case often fits ordinary control labels; uppercase remains suitable for genuine abbreviations or an intentional content system. A vague eyebrow such as “LOCAL IMAGE TOOL” adds little when the object and action already explain the utility. Do not replace it with another decorative name.

## Make the change itself part of the composition

For the decisive action, draw before → input acknowledgement → actual result → settled state, plus failure and repeated input. Choose what moves and what stays anchored. A download may briefly acknowledge preparation and then report that the browser download started; it cannot certify that a file was saved to disk. Do not add artificial waiting to make a spinner noticeable. Show selected values immediately, keep the active target stable, and let a new input replace stale feedback.

Use `scripts/visual_inventory.mjs` with an existing browser harness when useful. It reports rendered text, geometry, controls and boundaries for inspection. Its counts are observations, not a beauty score or automatic prohibition. Compare ordinary and narrow captures; a DOM inventory cannot establish visual balance or motion quality by itself.

Sources and limits: [NN/G on duplicated interface information](https://www.nngroup.com/articles/reduce-redundancydecrease-duplicated-design-decisions/) distinguishes unnecessary duplication from useful alternative navigation. [NN/G on progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/) places frequent choices first and requires an understandable route to secondary options. These principles motivate this working method; they do not validate Seenry output or prescribe its visual style. The exporter failures are development evidence for this method, not an unseen benchmark.
