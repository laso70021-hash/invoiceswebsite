ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft';
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS share_token uuid;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS documents_share_token_idx ON public.documents(share_token);

CREATE OR REPLACE FUNCTION public.get_shared_document(_token uuid)
RETURNS TABLE(kind text, number text, party_name text, party_details text, issue_date date, due_date date, currency text, items jsonb, tax_rate numeric, subtotal numeric, tax numeric, total numeric, notes text, status text, business_name text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT d.kind, d.number, d.party_name, d.party_details, d.issue_date, d.due_date, d.currency, d.items, d.tax_rate, d.subtotal, d.tax, d.total, d.notes, d.status, p.business_name
  FROM public.documents d LEFT JOIN public.profiles p ON p.id = d.user_id
  WHERE _token IS NOT NULL AND d.share_token = _token
$$;

CREATE OR REPLACE FUNCTION public.respond_shared_document(_token uuid, _accept boolean)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s text;
BEGIN
  UPDATE public.documents SET status = CASE WHEN _accept THEN 'accepted' ELSE 'declined' END
  WHERE share_token = _token AND _token IS NOT NULL AND status IN ('sent','accepted','declined')
  RETURNING status INTO s;
  IF s IS NULL THEN RAISE EXCEPTION 'This link can no longer be answered'; END IF;
  RETURN s;
END $$;

REVOKE ALL ON FUNCTION public.get_shared_document(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.respond_shared_document(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_shared_document(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.respond_shared_document(uuid, boolean) TO anon, authenticated;