

## Plan: Fix calendar booking — missing config + immediate action execution

### Problem 1: "Calendar not enabled" error (root cause)

`widget-book-slot` is **missing from `supabase/config.toml`**. Without the `verify_jwt = false` entry, Supabase enforces JWT verification by default. The widget calls this function with only the anon `apikey` header (no `Authorization` bearer token), so the request either fails authentication before reaching the function code, or hits a different deployed version.

**Fix:** Add `[functions.widget-book-slot]` with `verify_jwt = false` to `supabase/config.toml`.

### Problem 2: NEO says "ще проверя" then waits

This is a Gemini model behavior issue — it outputs speech text first ("Разбирам, ще проверя...") in one turn, then outputs the JSON action in a subsequent turn. The action detection only runs at `TURN_COMPLETE`. So there's a full turn delay.

**Fix:** Detect `book_slot` JSON **during streaming** (in the `MODEL PART TEXT` handler around line 3843) and fire the action immediately without waiting for `turnComplete`. This way the API call happens while NEO is still speaking. The existing code already detects `book_slot` as `looksLikeAction` (line 3840) but only stores it — it doesn't execute it early.

Add an early-execution path: when a complete `book_slot` JSON is detected in a streaming part, immediately call `maybeExecuteActionFromGemini` in parallel (fire-and-forget). The `TURN_COMPLETE` handler will see the action was already handled.

### Changes

| File | Change |
|------|--------|
| `supabase/config.toml` | Add `[functions.widget-book-slot]` with `verify_jwt = false` |
| `src/hooks/useGeminiVoice.ts` | ~line 3843: When `book_slot` JSON detected in stream, immediately fire `maybeExecuteActionFromGemini` in background. Add a ref `earlyActionFiredRef` to prevent double-execution at `TURN_COMPLETE`. |

### Technical detail

For the early action execution, add a guard ref:
```
const earlyActionFiredRef = useRef(false);
```

In the streaming handler (line 3843), after detecting a complete `book_slot` JSON:
```
if (looksLikeAction && partText.includes("book_slot")) {
  earlyActionFiredRef.current = true;
  void maybeExecuteActionFromGemini(partText);
}
```

In `TURN_COMPLETE` (line 3900), skip action execution if `earlyActionFiredRef.current` was set, then reset it.

