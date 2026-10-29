ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspended boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.is_active(_uid uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT NOT COALESCE((SELECT suspended FROM public.profiles WHERE id = _uid), false)
$$;

-- Admin read access across the platform
CREATE POLICY "admin read profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin read customers" ON public.customers FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin read invoices" ON public.invoices FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin delete invoices" ON public.invoices FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin read payments" ON public.payments FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin read roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Suspended users cannot create or change data
CREATE POLICY "active only insert customers" ON public.customers AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (public.is_active(auth.uid()));
CREATE POLICY "active only update customers" ON public.customers AS RESTRICTIVE FOR UPDATE TO authenticated USING (public.is_active(auth.uid()));
CREATE POLICY "active only insert invoices" ON public.invoices AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (public.is_active(auth.uid()));
CREATE POLICY "active only update invoices" ON public.invoices AS RESTRICTIVE FOR UPDATE TO authenticated USING (public.is_active(auth.uid()));
CREATE POLICY "active only insert payments" ON public.payments AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (public.is_active(auth.uid()));

-- Users must not flip their own suspended flag
CREATE OR REPLACE FUNCTION public.protect_suspended() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.suspended IS DISTINCT FROM OLD.suspended AND current_user = 'authenticated' AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER profiles_protect_suspended BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.protect_suspended();

CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE(id uuid, email text, full_name text, business_name text, suspended boolean, is_admin boolean, created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admins only'; END IF;
  RETURN QUERY SELECT u.id, u.email::text, p.full_name, p.business_name, COALESCE(p.suspended,false),
    public.has_role(u.id,'admin'), u.created_at FROM auth.users u LEFT JOIN public.profiles p ON p.id = u.id ORDER BY u.created_at DESC;
END $$;

CREATE OR REPLACE FUNCTION public.admin_set_suspended(_user uuid, _value boolean) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admins only'; END IF;
  IF _user = auth.uid() THEN RAISE EXCEPTION 'You cannot suspend yourself'; END IF;
  INSERT INTO public.profiles(id, suspended) VALUES (_user, _value) ON CONFLICT (id) DO UPDATE SET suspended = _value;
END $$;

CREATE OR REPLACE FUNCTION public.admin_set_admin(_user uuid, _value boolean) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admins only'; END IF;
  IF _user = auth.uid() AND NOT _value THEN RAISE EXCEPTION 'You cannot remove your own admin role'; END IF;
  IF _value THEN INSERT INTO public.user_roles(user_id, role) VALUES (_user,'admin') ON CONFLICT DO NOTHING;
  ELSE DELETE FROM public.user_roles WHERE user_id = _user AND role = 'admin'; END IF;
END $$;

REVOKE ALL ON FUNCTION public.admin_list_users() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_set_suspended(uuid, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_set_admin(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_suspended(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_admin(uuid, boolean) TO authenticated;