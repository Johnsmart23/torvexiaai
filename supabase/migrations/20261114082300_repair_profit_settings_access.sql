CREATE TABLE IF NOT EXISTS public.investment_settings (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  profits_paused BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.investment_settings (id, profits_paused)
VALUES (1, false)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.investment_settings ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.investment_settings TO authenticated;

DROP POLICY IF EXISTS "Authenticated users can view investment settings"
  ON public.investment_settings;
CREATE POLICY "Authenticated users can view investment settings"
  ON public.investment_settings FOR SELECT TO authenticated
  USING (true);
