CREATE OR REPLACE FUNCTION public.validate_invoice_payment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE inv public.invoices; paid numeric;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'Recorded payments cannot be changed; remove and record again.';
  END IF;
  SELECT * INTO inv FROM public.invoices WHERE id = NEW.invoice_id FOR UPDATE;
  IF NOT FOUND OR inv.user_id <> NEW.user_id OR (auth.uid() IS NOT NULL AND inv.user_id <> auth.uid()) THEN
    RAISE EXCEPTION 'Invoice not available to this account.';
  END IF;
  IF inv.status = 'draft' THEN RAISE EXCEPTION 'Finalize the invoice before recording a payment.'; END IF;
  IF NEW.amount <= 0 OR NEW.amount::text IN ('NaN', 'Infinity', '-Infinity') THEN RAISE EXCEPTION 'Payment must be greater than zero.'; END IF;
  SELECT coalesce(sum(amount), 0) INTO paid FROM public.payments WHERE invoice_id = NEW.invoice_id;
  IF NEW.amount > inv.total - paid THEN RAISE EXCEPTION 'Payment exceeds the remaining balance.'; END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER payments_validate BEFORE INSERT OR UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.validate_invoice_payment();