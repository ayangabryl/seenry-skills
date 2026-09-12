# Context efficiency and finished design

Research checked 12 September 2026. This is a maintainer study, not a required reading packet for every design. The objective is fewer resources per accepted, working deliverable while preserving acceptance rate. Short instructions, a passing parser and a small bill alone do not establish design quality.

## What an agent actually loads

Codex initially exposes skill names, descriptions and paths, then reads the selected SKILL.md. A skill's installed size is therefore different from its current context cost. Host versions and integrations can differ; direct packet delivery must be measured separately. [OpenAI skill documentation](https://learn.chatgpt.com/docs/build-skills)

Anthropic describes a similar progression from metadata to instructions and relevant supporting files. Suitable scripts can execute without putting their source into the prompt. This supports a short, discriminating entrypoint with deeper knowledge available on demand. [Anthropic Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)

At the starting revision, Seenry's five names and descriptions together occupied 1,258 characters, or 160 whitespace-separated words. This excludes host formatting and paths and is **not a token count**. The separate research, assets and motion directories are not automatically one large prompt. Our optional compiler, however, deliberately embeds selected resource bodies; its exact emitted prompt is a separate measurable payload.

Progressive reading needs precise routing. Sending the model through many ambiguous links can waste calls and context. Anthropic recommends sufficient informative context, rather than making brevity the sole objective. Seenry should retain concrete decision criteria and the evidence needed to make those decisions. [Context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)

## Where the remaining cost comes from

| Layer | Measure | Practical response |
| --- | --- | --- |
| Discovery | Names, descriptions and host formatting | Keep triggers discriminating; avoid duplicate entrypoints. |
| Selected guidance | Actual supplied bodies and hashes | Route by the unresolved question; reuse available guidance. |
| Working context | Task facts, current source, tool results and decisions | Keep a compact decision record; patch the retained source; run established helpers. |
| Visual evidence | Images actually attached or inspected | Select the decisive views; preserve detail needed to judge text, material and transitions. |
| Generation | Visible output and reported reasoning/thinking | Avoid repeated full-file rewrites; preserve enough capacity to complete the work. |
| Review and repair | All author and reviewer calls, including failures | Diagnose the cause, then repair that cause; stop repeated low-information loops. |

OpenAI reports reasoning within output usage; adding it again would double-count. An exhausted output budget can yield no visible deliverable even though work was billed. Keep the user's model choice and effort settings explicit. [Reasoning usage](https://developers.openai.com/api/docs/guides/reasoning)

For Gemini's **generateContent** API, preflight counting concerns input; post-call metadata includes prompt, candidate, thinking and cached-content fields. Preserve the API's field definitions and media accounting. AGY is a host wrapper: its reported usage is not automatically equivalent to an independently observed Google API call. Missing usage stays unknown. [Google token accounting](https://ai.google.dev/gemini-api/docs/generate-content/tokens)

## Caching and delegation

Caching can discount repeated input, but the content still participates in the request. Google explicitly counts cached tokens toward input limits and charges explicit cache storage. Cache use does not justify irrelevant instructions. [Google context caching](https://ai.google.dev/gemini-api/docs/generate-content/caching)

OpenAI cache behavior depends on matching prefixes, eligible boundaries, model and settings. Stable guidance can precede changing task material when the host supports it, but rearranging a local file does not guarantee cache hits. Check reported reuse and applicable cache-write charges before claiming savings. Seenry cannot configure every agent's hidden request construction. [OpenAI prompt caching](https://developers.openai.com/api/docs/guides/prompt-caching)

Independent agents can help with separable research or unbiased critique, while duplicated context and overlapping work add cost. Anthropic's research-system measurements are observations of that system, not a universal multiplier. Seenry therefore keeps construction in one author context where practical and makes extra delegation serve a concrete purpose. [Multiagent research engineering](https://www.anthropic.com/engineering/multi-agent-research-system)

Hosts supporting deferred tool discovery can also avoid exposing every tool schema initially. Use targeted discovery, not a dump of the complete available tool inventory. [OpenAI tool search](https://developers.openai.com/api/docs/guides/tools-tool-search)

## What we measured and changed

An offline audit of revision `8e144d9` constructed minimal component handoffs with media and motion explicitly absent to isolate text transport:

| Stage | Guide bodies, UTF-8 bytes | Constructed request/prompt bytes |
| --- | ---: | ---: |
| Plan | 14,725 | 18,317 |
| Type | 12,028 | 15,566 |
| Final review | 24,233 | 30,142 |

The reviewed Luna delivery added attachment instructions to reach 31,167 text bytes, plus a separate 3,054-byte output schema. Image tokens and hidden host context are excluded. These are diagnostic examples, not a typical-task estimate. They also differ from the earlier component-with-feedback word-count study.

Removing JSON indentation saved only 274–401 bytes in the measured author prompts. We retained the readable delivery format. The larger opportunities are correct resource selection, avoiding duplicate author contexts and reducing failed rewrites. Existing revision handoffs already supply an identical retained source once.

The updated tooling records full delivered text size alongside the existing raw provider usage. Review preparation keeps size data in a separate sidecar; it does not give private author metadata to the critic. Counts at the final model adapter include appended attachment instructions. Token counts remain null when no provider/tokenizer measurement exists. No new model calls, token API requests or mandatory dependency were needed for this audit.

Validation: 140 Python tests and package validation pass locally. Tests cover Unicode bytes versus characters, prepared versus delivered prompts, withheld images, schema size, zero/null usage and simulated CRLF files. The newline fixtures do not establish execution on another operating system. These checks establish accounting behavior, not visual-quality retention.

Use one representative fresh output check after a relevant change. Preserve every attempt and its measured usage, elapsed time, repairs and final visual/functional disposition. For a comparison, keep the model, settings, inputs and tools equal. Report acceptance rate and total attempt cost per accepted deliverable together. If nothing is accepted, there is no successful-deliverable cost to report. Broader evaluation is warranted for a broader performance claim, not every maintenance edit.
