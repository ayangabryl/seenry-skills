# Writing

Copy is interface. Generic copy makes a well-built page look generated.

## Marketing copy

- **Headline says what it is or what changes,** in under 10 words. "Email for developers" (Resend), "Financial infrastructure to grow your revenue" (Stripe). Not "Unlock the power of…", "Supercharge your workflow", "The future of X is here".
- **Lead is one sentence** that names who it is for and the concrete result.
- **Every claim has proof nearby:** a number, a customer, a screenshot. Delete adjectives that no evidence supports ("seamless", "cutting-edge", "revolutionary", "effortless", "robust").
- **Feature titles are outcomes or mechanisms,** not categories. "Triage issues from Slack" beats "Integrations".
- **CTAs are verbs about the next step:** "Start free trial", "Book a demo", "Deploy now". Not "Get started today!" everywhere, and not "Learn more" as a primary action.

## Product copy

- Sentence case everywhere. No title case buttons, no ALL CAPS labels (except a single overline role).
- **Buttons are verb + object:** "Create project", "Save changes", "Delete 3 files". The dialog title and its confirm button use the same verb.
- **Labels are nouns,** short and specific: "Billing email", not "Please enter your billing email address".
- **Help text answers the question the label raises,** in one line.
- **Errors say what happened and how to fix it,** next to the field: "Card number is 15 digits for Amex. Check the number and try again." Never "Invalid input" or "Something went wrong" without a next step.
- **Empty states** say what will appear here and how to make it appear: "No invoices yet. Invoices appear after your first paid order."
- **Numbers** are exact when people act on them; round only in summaries and say so.
- **Confirmations** name the object: "Project 'Atlas' deleted. Undo."

## Voice

Pick three words for the product's voice (e.g. "direct, calm, expert") and write every string against them. Keep a short glossary in `DESIGN.md` so the same thing has the same name on every page (workspace vs. team vs. org).

## Placeholder content is still content

- Use realistic names, companies, amounts, dates and statuses that match the product's domain. "Acme Inc", "John Doe", "Lorem ipsum" and "$99.99" everywhere read as template.
- Vary lengths so layouts are tested: a 3-word title next to a 12-word one.
- Keep invented data internally consistent: totals add up, dates are in order, statuses match the timeline.

## Common failures

| Failure | Fix |
| --- | --- |
| "Unlock", "Supercharge", "Elevate", "Seamless", "Next-gen" | Say the concrete mechanism or result |
| Three feature cards titled "Fast", "Secure", "Scalable" | Name the specific capability and prove it |
| "Get Started" on every button | Verb for the specific next step |
| Error: "Invalid email" | "Enter an email like name@company.com" |
| Emoji in headings and bullets | Remove, or use one icon family |
| Exclamation marks in product UI | Remove |
