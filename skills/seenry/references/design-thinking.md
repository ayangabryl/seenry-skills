# Design thinking: find this brand's idea before choosing any pattern

Great pages are not assembled from good components. They start from one idea that could only belong to this product, and every section expresses it. Studios reach it by asking what is true about this product and showing that truth, not by choosing a layout: Stripe's hero ribbon is money in motion, Linear's first screen is the product itself at work, Aesop sells with the object and the light, not adjectives. Each visual came from its own product's truth; copying any of them onto another brand is the opposite of what they did. The same goes for any reference in these files, including America.gov: learn the move, never its visuals.

## 1. Find the truth

Write down, in the product's own words:
- **The claim:** the one thing it promises that competitors cannot say as well.
- **The proof:** the concrete fact, number, object or action that proves it (29,000 sites; the same second for everyone in a room; a roast date every Monday; money owed today).
- **The moment:** what the person does or feels at the instant the product works for them.
- **The material:** the real things of this world (the product UI, the objects, places, documents, sounds, people).

If you cannot fill these from the brief, ask or infer carefully; do not replace them with adjectives.

## 2. Generate ideas with designer moves

Produce at least five candidate ideas using different moves, each as one sentence describing what the person sees and does:

| Move | Question it asks | Example of the move (not a template) |
| --- | --- | --- |
| Make the claim literal | What would the promise look like if it happened on screen? | A roast date that is this Monday; the invoice total that is already reconciled; readable, never a cloud of tiny tokens |
| Let them do it now | Can the first screen be the product working, not a picture of it? | The question field is the hero; the size picker already sets the price |
| Proof inside the language | Can the evidence sit inside the sentence that makes the claim? | The actual roast date inside "roasted Monday"; the real response time inside "we answer fast" |
| Before and after | Is the value a change the person can see? | A messy inbox of invoices settling into one total |
| Borrow a physical truth | What real object or ritual already means this? | A receipt, a ticket stub, a vinyl run-out groove, a cupping card, only if it explains |
| The detail that proves care | What small thing would only a team that cares add? | The close button landing under the pointer; the price that counts up only the digits that change |
| Take something away | What would be braver with less? | One sentence and one field on the whole first screen |
| Change the unit | Can the page speak in the user's unit, not the company's? | "You are owed $4,820 today" instead of "Outstanding balance" |

Search the Seenry library for how others solved *this kind of problem* (not this layout), for example `search_designs` or `search_references` with the claim's verb or object, and note ideas that move you and why.

## 3. Choose one idea and test it

Score each candidate 1–5 on:
- **Truth:** does it come from this product's real claim and proof?
- **Clarity:** would a first-time visitor understand the promise faster because of it?
- **Distinctiveness:** would it look wrong on a competitor's page (the swap test)?
- **Restraint:** can it be done cleanly, with no decoration, in the Seenry standard?
- **Buildability:** can it be built well in this stack and time, with a real still state?

Pick the highest total. Then carry the same idea through the page: the hero, one signature moment, the imagery, the copy and at least one small detail should all express it. Everything else stays quiet.

## 4. Use kits as tools, never as ideas

The component and signature kits are how to build the idea well (tokens, accessibility, motion quality). They are never the idea. Do not choose a kit component first and fit the brand to it. If the chosen idea happens to be served best by a kit component (a statement with inline objects, a product demo), adapt it so it clearly belongs to this brand; if two different briefs would get the same signature, you skipped this method.

## 5. Record it

Write `.seenry/idea.md`: the truth (claim, proof, moment, material), the five candidates with their scores, the chosen idea and why, and where it appears on the page (hero, signature moment, imagery, copy, detail). check.mjs requires this file; the report opens with the chosen idea in one sentence.
