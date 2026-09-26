# Forms that survive mistakes

Use this guide when building signup, sign-in, checkout or any consequential submission. The happy state is only one part of the component.

## Required state contract

Write down empty, editing, invalid, submitting, server failure, retry and confirmed success. Map each state to visible copy, control availability, focus and announcements. Preserve typed values across failures and ordinary rerenders. Never remount the input to trigger an animation. Never log or persist passwords for a demo.

- Keep submit available before validation; on submit, validate every relevant field, show specific inline recovery messages, and focus the first invalid field. Label inputs and connect error/help text through `aria-describedby`; set `aria-invalid` only when invalid.
- Avoid scolding untouched fields on first paint. After an attempted submission, clear or update an existing error as the user corrects it. Do not wait for another failed submission to acknowledge a correction.
- Reserve enough room for realistic help/error copy where a stable layout matters. Do not truncate translated errors to force a fixed height.
- Pending submission has one owner. Block duplicate requests, announce progress, and protect against stale responses. Only confirm success after the authoritative operation succeeds.
- A connection failure keeps the input and offers retry. Distinguish network failure from field validation. Server-side validation, rate limits, secure session handling and email verification are backend work; frontend polish does not establish them.
- Motion is optional feedback: a small local nudge or opacity change, never a shaking page. Keep focused inputs mounted, support interruption, and disable decorative movement under reduced motion. Use words as well as color.
- Password reveal is a named toggle; preserve caret and entered values. Allow paste, autofill and password managers. Follow the application's actual password policy instead of inventing complexity rules.

## Verify the result

Exercise empty submit, invalid address, one corrected field, valid submit, slow response, double submit, server rejection and retry. Check focus and screen-reader associations, keyboard submission, narrow layout and reduced motion. For a local showcase, say explicitly that no account is created and use a clearly labelled failure simulation rather than fabricating a real network error.

Apply this contract where a project actually needs a form. Do not add an unrelated signup demonstration to a skill showcase merely to advertise error handling.
