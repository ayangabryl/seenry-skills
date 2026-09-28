# Fresh consumer brief: capacity control

Build one original responsive component for a workshop host choosing a seat capacity. This is a product control, not a landing page. The host has 16 confirmed guests and 8 people on a waitlist. Capacity can be set from 16 to 28 seats in whole numbers. The component must show current capacity, available seats for confirmed guests, and how many waitlisted people could fit if capacity increases. Use plain, accurate labels; do not imply that changing the control actually admits anyone.

The capacity value should respond to pointer drag, touch and keyboard input. Movement should help the host see the change: a thumb/marker, a changing count, and the relationship to the confirmed and waitlisted groups. Keep the important numbers stable and readable during movement. On rapid reversal and reduced motion, the displayed state must stay in sync. A reset action returns to 16 seats. The component must remain usable at 390 and 320 CSS px.

Use the local Seenry Motion skill at /private/tmp/seenry-example-composition-repair/skills/seenry-motion/SKILL.md and only the focused guidance it routes to. No brand, source layout, font or animation is prescribed. Build a working local prototype, save DESIGN.md with the chosen interaction contract and files read, source files, first complete wide/390/320 captures and a RESULTS.md. Stop after your first complete render and functional checks, before any review-led repair. If browser capture is blocked, preserve the source and report the exact limit.

An external localhost server is available at `http://127.0.0.1:8770/` for the trial directory. Use that HTTP route for browser captures; do not open a `file:` URL.
