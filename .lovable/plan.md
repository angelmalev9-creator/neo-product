

## Plan: Connect gemini-session to calendar system

### Root cause

The `gemini-session` edge function (deployed but not in local codebase) builds its **own** system prompt and returns it as `instruction`. However, `useGeminiVoice` reads `data.systemInstruction` — a field that doesn't exist in the response. This means:

1. The calendar instructions injected by `widget-session` into `systemPrompt` are sent to `gemini-session` but **discarded** — `gemini-session` builds its own prompt.
2. `useGeminiVoice` stores an empty/undefined `systemInstruction`, so `hasCalendarInSystemInstruction()` always returns `false`.
3. All calendar fallbacks and `submit_form` interception are **dead code** because they check `systemInstruction`.

### Fix approach

Since `gemini-session` is an externally deployed function we can't modify locally, the fix is in `useGeminiVoice.ts`:

**Step 1: Read the correct field from gemini-session response**

In `prepareSession`, change:
```
systemInstruction: data.systemInstruction || ""
```
to:
```
systemInstruction: data.systemInstruction || data.instruction || ""
```

**Step 2: Append calendar instructions to the resolved systemInstruction**

The `systemPrompt` passed to `prepareSession` (from `widget-session`) contains the calendar block. After getting `gemini-session`'s response, extract the calendar section from the original `systemPrompt` and append it to the `instruction` returned by `gemini-session`.

In `prepareSession`:
- Accept and store the original `systemPrompt` in a ref
- After getting `gemini-session` response, check if the original prompt contains calendar instructions (the `##############################` block)
- If yes, append it to the resolved `instruction` — this ensures the calendar rules override the form rules from `gemini-session`

**Step 3: Also strip conflicting form rules from gemini-session's prompt when calendar is active**

Apply the same regex sanitization (already in `widget-session`) to the `instruction` from `gemini-session`:
- Remove `ФОРМИ И ДЕЙСТВИЯ` section
- Replace `submit_form` references with `(DISABLED)`
- Replace `can_submit_forms: true` with `false`

### Files to change

| File | Change |
|------|--------|
| `src/hooks/useGeminiVoice.ts` | Fix field name (`instruction` fallback), append calendar block from original systemPrompt, sanitize form rules when calendar is active |

### Technical details

The calendar block is identifiable by the marker `##############################` followed by `# КАЛЕНДАР`. We extract everything from that marker to end-of-string from the original `systemPrompt` and append it to the `gemini-session` instruction. The form-stripping regexes from `widget-session` are replicated client-side to ensure the `gemini-session` prompt's form instructions don't conflict.

