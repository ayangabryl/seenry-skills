# Keep facts and actions true in the finished interface

Use this when a new page, prototype or flow contains event details, product claims, booking, checkout, download, contact, account creation or another consequential action. The visual direction may be expressive; the user's facts and the control's result stay literal.

## Before drafting

Make a small private ledger with three columns: supplied and verified facts; fiction explicitly allowed by the brief; unknown operational details. A request for fictional film titles permits invented titles, not an invented doors time, venue address, discount or booking endpoint. Preserve what a supplied number *means*: a 7:00 PM event time does not establish when doors open or when the lights go down. Do not turn a rounded design placeholder into a precise factual claim. Research can fill a gap only when the source is relevant, current and permitted for the task; otherwise leave the gap unresolved.

When a requested section needs details the brief does not supply, present plausible examples as possibilities rather than confirmed promises. A beginner workshop may show example forms someone could make; it should not promise a specific project, technique, material or take-home result without support. Keep such examples visibly framed as examples and record the assumption in the handoff.

In a product concept or local demo, do not present invented document counts, recent items, saved states, storage quotas or named people as existing user data. Mark samples as samples, or derive values from working local state. A changing row count does not establish gigabytes stored. Verify attributed quotations against a primary source before presenting them as verbatim; paraphrase without quotation marks and attribution when verification is unavailable.

For each prominent action, write `visible label → actual target → result`. A target is a real page, supplied URL, working local section, functioning operation or valid contact address. `href="#"`, an empty handler and a simulated success screen are not targets. Keep the same destination meaning when a CTA repeats in the hero, body and closing section.

For browser-local saving, show “saved here” only after `localStorage`, IndexedDB or another real write succeeds. A caught write error must leave the content available to copy and report that it was not saved. Do not set a success status after a swallowed exception or before an async write resolves.

If the brief requests booking, registration or payment but supplies no usable endpoint or backend, still show the available ticket or product information. Label links to an on-page information section as “Ticket details” or “Workshop details,” including in navigation; do not label them “Reserve,” “Register” or “Registration” when those actions cannot happen. A real recipient or URL can support an appropriately labeled inquiry or external booking link. Do not invent a recipient, URL, checkout state, scarcity, “original listing,” contact channel or coming-soon plan. Omit unavailable booking or registration controls entirely. Do not tell visitors to find an unspecified channel, that a connection is missing, or what the brief did not provide. Mention the missing integration in the handoff only. If a real completion path is mandatory, report that the action remains incomplete.

## After implementation

1. Inventory visible actions in the **delivered** files, including secondary navigation, tabs, filters, row controls and pagination. Trace label → target → result. Remove unsupported controls; a demo toast does not make a feature button work. Check repeated actions, including sticky and footer CTAs.
2. Search the rendered copy for dates, times, prices, counts, addresses, percentages, testimonials, availability and guarantees. Match each factual claim **and its meaning** to the ledger. Check numeric details in metadata and alt text too. If the brief allowed fiction, keep it visibly within that scope.
3. Activate the main action with keyboard and pointer when a browser is available. Test a failure or missing destination instead of showing false success. If browser execution is unavailable, inspect source targets and report the behavioral limit.
4. Fix contradictory labels or unsupported details before handoff. State any necessary missing hookup once in the report; do not turn implementation uncertainty into decorative visitor copy.

The ledger is a working check, not required page content. A polished interface with an invented claim or misleading CTA is unfinished.
