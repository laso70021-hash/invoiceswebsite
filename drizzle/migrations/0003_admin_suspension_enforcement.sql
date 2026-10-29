CREATE OR REPLACE FUNCTION public.protect_suspended() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    IF (TG_OP = 'INSERT' AND NEW.suspended) OR (TG_OP = 'UPDATE' AND NEW.suspended IS DISTINCT FROM OLD.suspended) THEN
      RAISE EXCEPTION 'Only admins can change suspension status';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER profiles_protect_suspended_insert BEFORE INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.protect_suspended();
CREATE POLICY "active only delete customers" ON public.customers AS RESTRICTIVE FOR DELETE TO authenticated USING (public.is_active(auth.uid()));
CREATE POLICY "active only delete invoices" ON public.invoices AS RESTRICTIVE FOR DELETE TO authenticated USING (public.is_active(auth.uid()));
CREATE POLICY "active only update payments" ON public.payments AS RESTRICTIVE FOR UPDATE TO authenticated USING (public.is_active(auth.uid())) WITH CHECK (public.is_active(auth.uid()));
CREATE POLICY "active only delete payments" ON public.payments AS RESTRICTIVE FOR DELETE TO authenticated USING (public.is_active(auth.uid()));