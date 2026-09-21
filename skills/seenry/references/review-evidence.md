# Let evidence determine the next action

Use at the current design checkpoint or affected states of a refinement. Judge only this stage's requirements. A narrow fix does not require a new full-product review.

Keep **quality** (`pass`, `revise`, `fail`, `unverified`) separate from **support**:

| Support | Meaning | Action |
| --- | --- | --- |
| `supported` | Inspected evidence supports the verdict; describe what resolves the question. | A supported pass may advance to review. A supported defect needs repair. |
| `uncertain` | Evidence was inspected, but plausible alternatives remain. Name them. | Compare one controlled change on identical content. |
| `uninspected` | The necessary view or behavior was not inspected. | Obtain that evidence; keep quality unverified. |

For each criterion cite the artifact, observable reason, support reason and the smallest next check. Example: “The primary action competes with the colored sidebar; compare a quieter sidebar while retaining button, copy and geometry.” For unobserved motion, request normal-speed playback with repeated input instead of inventing an animation repair.

A confident failure is still a failure. Reviewer agreement and supplied file hashes do not prove inspection, correctness or acceptance. Avoid numerical confidence, weighted quality averages and automatic aesthetic scores until predictions have been checked against independent designer judgments on fresh briefs.

New `scripts/review_request.py` requests use review version 2. `scripts/review_gate.py` checks disposition consistency and routes unresolved checks. It cannot inspect pixels or establish calibrated confidence. Version 1 remains available explicitly for historical requests; it has no support assessment.

Keep next checks within the remaining time and repair/reset allowance. Missing evidence alone does not consume a code-repair pass. If unresolved when the allowance ends, deliver the artifact with review status and the concrete limitation. Never loop merely to get a higher confidence label.
