
CREATE TABLE public.timer_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled boolean NOT NULL DEFAULT false,
  on_time text NOT NULL DEFAULT '18:30',
  off_time text NOT NULL DEFAULT '06:00',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.timer_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to timer_settings" ON public.timer_settings FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.timer_settings (enabled, on_time, off_time) VALUES (false, '18:30', '06:00');

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
