
-- Add booking_type to calendar_settings so NEO knows what to call it
ALTER TABLE public.calendar_settings 
ADD COLUMN IF NOT EXISTS booking_type text DEFAULT 'consultation';

-- Remove Google OAuth columns (no longer needed - using built-in calendar)
-- We keep the columns but they won't be used anymore
-- calendar_access_token, calendar_refresh_token, calendar_token_expires_at, calendar_email stay for backward compat

-- Add time_slots table for the built-in calendar
CREATE TABLE IF NOT EXISTS public.calendar_time_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  booking_id uuid REFERENCES public.calendar_bookings(id) ON DELETE SET NULL,
  slot_date date NOT NULL,
  slot_start time NOT NULL,
  slot_end time NOT NULL,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, slot_date, slot_start)
);

ALTER TABLE public.calendar_time_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own slots" ON public.calendar_time_slots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own slots" ON public.calendar_time_slots FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage slots" ON public.calendar_time_slots FOR ALL USING (current_setting('role', true) = 'service_role');
