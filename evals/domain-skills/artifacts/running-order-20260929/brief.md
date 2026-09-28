# Trial brief: running order

Build one original web component for a small event producer arranging a three-part public talk. The component should let the producer reorder agenda items and immediately see each item's start time. The visual finish should feel like a real product component, not a motion demo.

Facts: the event begins at 18:00. “Doors and welcome” lasts 10 minutes, “Field notes” lasts 25 minutes, and “Audience questions” lasts 15 minutes. These are illustrative local data. There is no server or collaborative editing. Keep the item identities and durations stable during reorder; recompute start times from the current order. Provide a clear reset action and a visible local confirmation after a move.

Interaction target: pointer drag and touch drag move an item to another position. During drag, make the held item and prospective slot legible; nearby items should move to make room. On release, the settled order and time labels must agree. A keyboard user can reorder with a documented control; focus stays understandable. Rapid reversal, cancelled drag, resize, and reduced-motion mode must preserve the same order logic. Motion should support the task, not delay the data.

Use the local published Seenry motion source at /Users/ayangabryl/Documents/Dev/seenry-skill/skills/seenry-motion/SKILL.md. If available, inspect actual playback of Seenry motion reference f97afc7b44ced5530ba27d573fc7318f; describe observed frames separately from any proposed behavior. Do not copy its palette, content, imagery or card layout.

Work only in this trial directory. Save a short DESIGN.md naming the interaction contract and files read, complete runnable source, wide/phone captures of the settled default, at least one intermediate drag capture and a reordered settled capture, and a RESULTS.md with checks run and limits. Preserve the first complete implementation and captures before any review-led repair; stop after that first implementation and your own functional checks. The parent evaluator will review it independently.
