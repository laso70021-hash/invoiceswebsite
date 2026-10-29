ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tax_id text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS default_tax_rate numeric NOT NULL DEFAULT 18;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS payment_instructions text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS brand_color text NOT NULL DEFAULT '#0f766e';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS template_style text NOT NULL DEFAULT 'band';

CREATE TABLE public.catalog_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  kind text NOT NULL DEFAULT 'product' CHECK (kind IN ('product','service')),
  name text NOT NULL,
  unit text,
  price numeric NOT NULL DEFAULT 0,
  stock numeric NOT NULL DEFAULT 0,
  low_stock numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL, email text, phone text, address text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  category text NOT NULL DEFAULT 'General',
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  description text,
  amount numeric NOT NULL CHECK (amount > 0),
  tax numeric NOT NULL DEFAULT 0,
  spent_on date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.recurring_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  tax_rate numeric NOT NULL DEFAULT 18,
  subtotal numeric NOT NULL DEFAULT 0,
  tax numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'TZS',
  every text NOT NULL DEFAULT 'monthly' CHECK (every IN ('weekly','monthly')),
  next_date date NOT NULL DEFAULT CURRENT_DATE,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.catalog_items, public.suppliers, public.expenses, public.recurring_invoices TO authenticated;
GRANT ALL ON public.catalog_items, public.suppliers, public.expenses, public.recurring_invoices TO service_role;
ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own catalog" ON public.catalog_items FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND public.is_active(auth.uid()));
CREATE POLICY "own suppliers" ON public.suppliers FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND public.is_active(auth.uid()));
CREATE POLICY "own expenses" ON public.expenses FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND public.is_active(auth.uid()));
CREATE POLICY "own recurring" ON public.recurring_invoices FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND public.is_active(auth.uid()));

CREATE OR REPLACE FUNCTION public.run_recurring_invoices(_only_me boolean DEFAULT true)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record; n integer := 0;
BEGIN
  IF _only_me AND auth.uid() IS NULL THEN RETURN 0; END IF;
  IF NOT _only_me AND auth.uid() IS NOT NULL THEN RAISE EXCEPTION 'not allowed'; END IF;
  FOR r IN SELECT * FROM public.recurring_invoices
    WHERE active AND next_date <= CURRENT_DATE AND (NOT _only_me OR user_id = auth.uid()) AND public.is_active(user_id)
    FOR UPDATE SKIP LOCKED
  LOOP
    INSERT INTO public.invoices (user_id, customer_id, currency, items, tax_rate, subtotal, tax, total, status, due_date)
    VALUES (r.user_id, r.customer_id, r.currency, r.items, r.tax_rate, r.subtotal, r.tax, r.total, 'sent', CURRENT_DATE + 14);
    UPDATE public.recurring_invoices SET next_date = CASE WHEN every = 'weekly' THEN next_date + 7 ELSE (next_date + interval '1 month')::date END WHERE id = r.id;
    n := n + 1;
  END LOOP;
  RETURN n;
END $$;
REVOKE ALL ON FUNCTION public.run_recurring_invoices(boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.run_recurring_invoices(boolean) TO authenticated;