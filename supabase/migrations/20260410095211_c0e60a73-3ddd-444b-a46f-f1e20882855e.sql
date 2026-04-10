
-- Create booking_items table
CREATE TABLE public.booking_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC,
  price_unit TEXT DEFAULT 'нощ',
  capacity INTEGER,
  amenities TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  category TEXT DEFAULT 'стая',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.booking_items ENABLE ROW LEVEL SECURITY;

-- Owner CRUD
CREATE POLICY "Users can view own booking items"
  ON public.booking_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own booking items"
  ON public.booking_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own booking items"
  ON public.booking_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own booking items"
  ON public.booking_items FOR DELETE
  USING (auth.uid() = user_id);

-- Service role full access (for widget/edge functions)
CREATE POLICY "Service role full access booking_items"
  ON public.booking_items FOR ALL
  USING (current_setting('role', true) = 'service_role');

-- Timestamp trigger
CREATE TRIGGER update_booking_items_updated_at
  BEFORE UPDATE ON public.booking_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for booking images
INSERT INTO storage.buckets (id, name, public) VALUES ('booking-images', 'booking-images', true);

-- Anyone can view booking images
CREATE POLICY "Booking images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'booking-images');

-- Users can upload their own booking images
CREATE POLICY "Users can upload booking images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'booking-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can update their own booking images
CREATE POLICY "Users can update booking images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'booking-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can delete their own booking images
CREATE POLICY "Users can delete booking images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'booking-images' AND auth.uid()::text = (storage.foldername(name))[1]);
