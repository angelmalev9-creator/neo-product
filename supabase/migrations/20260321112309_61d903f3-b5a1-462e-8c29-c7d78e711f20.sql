
-- Add required_booking_fields to calendar_settings
ALTER TABLE public.calendar_settings 
ADD COLUMN IF NOT EXISTS required_booking_fields text[] DEFAULT ARRAY['name']::text[];

-- Add attendee_phone and service to calendar_bookings
ALTER TABLE public.calendar_bookings 
ADD COLUMN IF NOT EXISTS attendee_phone text,
ADD COLUMN IF NOT EXISTS service text;
