

## Plan: Fix transcript persistence + configurable booking fields from dashboard

### Problems to solve
1. **NEO transcript vanishes on disconnect** — When the client disconnects, NEO's partial transcript disappears instead of being saved
2. **NEO asks for contact form fields instead of using calendar** — The system prompt still allows `submit_form` to trigger for missing fields
3. **Business needs to choose which data to collect for bookings** — Add configurable required fields (name, email, phone, service) in dashboard calendar settings

### Architecture overview

Key files and their roles:
- **`src/pages/Widget.tsx`** — Widget UI, handles connect/disconnect, transcript persistence
- **`src/hooks/useGeminiVoice.ts`** — Voice hook, action parsing (book_slot, submit_form), Gemini WebSocket
- **`supabase/functions/widget-session/index.ts`** — Builds system prompt for NEO, injects calendar instructions
- **`supabase/functions/widget-book-slot/index.ts`** — Handles get_slots/book actions
- **`src/components/dashboard/CalendarAutomation.tsx`** — Dashboard calendar settings UI
- **`src/components/dashboard/IntegrationsPanel.tsx`** — Toggle calendar on/off
- **`supabase/functions/widget-track-conversation/index.ts`** — Persists messages to DB

### Step 1: DB migration —