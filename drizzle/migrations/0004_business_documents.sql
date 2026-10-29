CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  kind text NOT NULL CHECK (kind IN ('proforma','tax_invoice','quotation','purchase_order','delivery_note')),
  number text,
  party_name text NOT NULL,
  party_details text,
  issue_date date NOT NULL DEFAULT current_date,
  due_date date,
  currency text NOT NULL DEFAULT 'TZS',
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  tax_rate numeric NOT NULL DEFAULT 18,
  subtotal numeric NOT NULL DEFAULT 0,
  tax numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, number)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own documents select" ON public.documents FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own documents insert" ON public.documents FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND public.is_active(auth.uid()));
CREATE POLICY "own documents update" ON public.documents FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND public.is_active(auth.uid()));
CREATE POLICY "own documents delete" ON public.documents FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.assign_document_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n int; p text;
BEGIN
  IF NEW.number IS NULL THEN
    p := CASE NEW.kind WHEN 'proforma' THEN 'PRO' WHEN 'tax_invoice' THEN 'TAX' WHEN 'quotation' THEN 'QUO' WHEN 'purchase_order' THEN 'PO' ELSE 'DN' END;
    PERFORM pg_advisory_xact_lock(hashtext(NEW.user_id::text || NEW.kind));
    SELECT count(*) + 1 INTO n FROM public.documents
      WHERE user_id = NEW.user_id AND kind = NEW.kind AND extract(year FROM issue_date) = extract(year FROM NEW.issue_date);
    NEW.number := p || '-' || extract(year FROM NEW.issue_date)::int || '-' || lpad(n::text, 4, '0');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER documents_number BEFORE INSERT ON public.documents
FOR EACH ROW EXECUTE FUNCTION public.assign_document_number();