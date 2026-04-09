
-- phone_numbers table
CREATE TABLE public.phone_numbers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid REFERENCES public.demo_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  twilio_sid varchar(64) NOT NULL,
  phone_number varchar(20) NOT NULL,
  friendly_name varchar(100),
  twilio_cost_monthly numeric(6,2) NOT NULL,
  customer_price_monthly numeric(6,2) NOT NULL,
  status varchar(20) DEFAULT 'active',
  webhook_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_phone_numbers_session ON public.phone_numbers(session_id);
CREATE INDEX idx_phone_numbers_phone ON public.phone_numbers(phone_number);
CREATE INDEX idx_phone_numbers_user ON public.phone_numbers(user_id);

ALTER TABLE public.phone_numbers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own phone numbers" ON public.phone_numbers
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users insert own phone numbers" ON public.phone_numbers
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own phone numbers" ON public.phone_numbers
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Service role full access phone_numbers" ON public.phone_numbers
  FOR ALL USING (current_setting('role', true) = 'service_role');

-- call_logs table
CREATE TABLE public.call_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number_id uuid REFERENCES public.phone_numbers(id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.demo_sessions(id) ON DELETE SET NULL,
  user_id uuid NOT NULL,
  twilio_call_sid varchar(64),
  caller_number varchar(20),
  direction varchar(10) DEFAULT 'inbound',
  status varchar(20) DEFAULT 'completed',
  duration_seconds int DEFAULT 0,
  twilio_cost numeric(8,4) DEFAULT 0,
  customer_cost numeric(8,4) DEFAULT 0,
  transcript text,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz
);

CREATE INDEX idx_call_logs_phone ON public.call_logs(phone_number_id);
CREATE INDEX idx_call_logs_session ON public.call_logs(session_id);
CREATE INDEX idx_call_logs_started ON public.call_logs(started_at DESC);
CREATE INDEX idx_call_logs_user ON public.call_logs(user_id);

ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own call logs" ON public.call_logs
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Service role full access call_logs" ON public.call_logs
  FOR ALL USING (current_setting('role', true) = 'service_role');

-- Updated_at trigger for phone_numbers
CREATE TRIGGER update_phone_numbers_updated_at
  BEFORE UPDATE ON public.phone_numbers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
