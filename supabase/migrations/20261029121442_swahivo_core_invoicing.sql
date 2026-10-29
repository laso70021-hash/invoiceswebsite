CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  business_name text,
  currency text NOT NULL DEFAULT 'TZS',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own roles read" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, business_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'business_name');
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL,
  email text,
  phone text,
  address text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own customers" ON public.customers FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  number text,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  issue_date date NOT NULL DEFAULT current_date,
  due_date date,
  currency text NOT NULL DEFAULT 'TZS',
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  tax_rate numeric NOT NULL DEFAULT 18,
  subtotal numeric NOT NULL DEFAULT 0,
  tax numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  amount_paid numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, number)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own invoices" ON public.invoices FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  method text NOT NULL DEFAULT 'Bank Transfer',
  paid_on date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own payments" ON public.payments FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.assign_invoice_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n int;
BEGIN
  IF NEW.number IS NULL THEN
    PERFORM pg_advisory_xact_lock(hashtext(NEW.user_id::text));
    SELECT count(*) + 1 INTO n FROM public.invoices
      WHERE user_id = NEW.user_id AND extract(year FROM issue_date) = extract(year FROM NEW.issue_date);
    NEW.number := 'INV-' || extract(year FROM NEW.issue_date)::int || '-' || lpad(n::text, 4, '0');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER invoices_number BEFORE INSERT ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.assign_invoice_number();

CREATE OR REPLACE FUNCTION public.apply_payment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE inv_id uuid; paid numeric; tot numeric;
BEGIN
  inv_id := COALESCE(NEW.invoice_id, OLD.invoice_id);
  SELECT COALESCE(sum(amount),0) INTO paid FROM public.payments WHERE invoice_id = inv_id;
  SELECT total INTO tot FROM public.invoices WHERE id = inv_id;
  UPDATE public.invoices SET amount_paid = paid,
    status = CASE WHEN paid >= tot AND tot > 0 THEN 'paid' WHEN paid > 0 THEN 'partial' ELSE CASE WHEN status IN ('paid','partial') THEN 'sent' ELSE status END END
  WHERE id = inv_id;
  RETURN NULL;
END $$;
CREATE TRIGGER payments_apply AFTER INSERT OR DELETE ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.apply_payment();