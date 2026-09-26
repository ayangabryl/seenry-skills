# Forms that survive mistakes

Use this guide when building signup, sign-in, checkout or any consequential submission. The happy state is only one part of the component.

## Required state contract

Write down empty, editing, invalid, submitting, server failure, retry and confirmed success. Map each state to visible copy, control availability, focus and announcements. Preserve typed values across failures and ordinary rerenders. Never remount the input to trigger an animation. Never log or persist passwords for a demo.

- Keep submit available before validation; on submit, validate every relevant field, show specific inline recovery messages, and focus the first invalid field. Label inputs and connect error/help text through `aria-describedby`; set `aria-invalid` only when invalid.
- For a radio or checkbox group, put the recovery message beside the group label or first choice, and associate it with the group or relevant control. After focus moves to the first invalid choice on a narrow screen, the message must remain in the visible viewport; a live region after the last choice can be several screens away.
- When one choice is required before the contact or confirmation step, preserve that sequence as the layout stacks. Do not use CSS `order` to put the later form above its prerequisite while keyboard focus still follows the DOM order.
- Avoid scolding untouched fields on first paint. After an attempted submission, clear or update an existing error as the user corrects it. Do not wait for another failed submission to acknowledge a correction.
- Reserve enough room for realistic help/error copy where a stable layout matters. Do not truncate translated errors to force a fixed height.
- Pending submission has one owner. Block duplicate requests, announce progress, and protect against stale responses. Only confirm success after the authoritative operation succeeds.
- A connection failure keeps the input and offers retry. Distinguish network failure from field validation. Server-side validation, rate limits, secure session handling and email verification are backend work; frontend polish does not establish them.
- Motion is optional feedback: a small local nudge or opacity change, never a shaking page. Keep focused inputs mounted, support interruption, and disable decorative movement under reduced motion. Use words as well as color.
- Password reveal is a named toggle; preserve caret and entered values. Allow paste, autofill and password managers. Follow the application's actual password policy instead of inventing complexity rules.

For a long choice group, place the error immediately after its legend, before the options. Keep that markup order when a wide layout becomes one column. For example:

```html
<fieldset>
  <legend>Choose one window</legend>
  <p id="window-error" role="alert"></p>
  <label><input type="radio" name="window" aria-describedby="window-error"> Morning</label>
  <!-- Other choices follow; contact fields and submit come after the fieldset. -->
</fieldset>
```

On an invalid submit, set specific error text and focus the first choice. Clear the error when a valid choice is made. The example shows placement and association; use the project's own content, styling and form state.

## Verify the result

Exercise empty submit, invalid address, one corrected field, valid submit, slow response, double submit, server rejection and retry. Check focus and screen-reader associations, keyboard submission, narrow layout and reduced motion. At the narrow viewport, inspect the initial task order and actual focus order, then submit an empty form and inspect what is visible after focus moves: the recovery message must be near the first invalid control, not merely somewhere in the DOM. For a local showcase, say explicitly that no account is created and use a clearly labelled failure simulation rather than fabricating a real network error.

Apply this contract where a project actually needs a form. Do not add an unrelated signup demonstration to a skill showcase merely to advertise error handling.
