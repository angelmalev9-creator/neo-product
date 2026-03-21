

## Plan: Fix NEO interruption sensitivity + transcript loss + calendar loop

### Problems identified

From the screenshot and logs:
1. **NEO interrupts from noise** — `MIN_BARGE_IN_CHARS=2`, `MIN_BARGE_IN_WORDS=2`, `ANTI_BARGE_IN_MS=350` are far too low. VAD barge-in triggers after just 5 frames with `rms > threshold * 1.2`. Background noise easily passes these thresholds.
2. **Transcript vanishes on interrupt** — In `TURN_COMPLETE` (line 3962), when `wasCanceled=true`, the assistant response is **suppressed entirely** — never delivered to `onMessage`. So whatever NEO said disappears from the chat.
3. **Calendar repetition loop** — NEO says "22 март не е работен ден, 23 март е свободен" → noise triggers barge-in → turn canceled → transcript lost → NEO restarts fresh → repeats same availability info → cycle continues.

### Changes

**File: `src/hooks/useGeminiVoice.ts`**

**A) Raise barge-in thresholds (only clear speech interrupts):**
- `ANTI_BARGE_IN_MS`: 350 → 1200 (NEO must speak 1.2s before any interrupt allowed)
- `MIN_BARGE_IN_CHARS`: 2 → 8
- `MIN_BARGE_IN_WORDS`: 2 → 3
- `VAD_BARGE_IN_FRAMES_REQUIRED`: 5 → 15
- VAD RMS multiplier: 1.2 → 2.5

**B) Preserve canceled assistant transcript:**
In `TURN_COMPLETE` handler (line 3962), instead of silently suppressing, deliver the partial text to `onMessage` so it stays visible:
```
} else {
  // Was canceled but still deliver text so it doesn't vanish
  onMessage?.({ role: "assistant", content: responseText });
  onTranscript?.(responseText, true, "assistant");
}
```

**C) Prevent calendar repetition loop:**
After a successful `get_slots` call returns availability info and NEO communicates it, store the response hash. In `shouldForceCalendarFallback`, skip if NEO is already talking about available dates (not refusing — just repeating).

### Technical details

The core issue chain is: low thresholds → noise triggers barge-in → `assistantTurnCanceledRef = true` → `TURN_COMPLETE` suppresses the text → user sees nothing → Gemini has no context of what was said → repeats. Fixing A+B breaks this chain entirely. Fix C is defense-in-depth.

