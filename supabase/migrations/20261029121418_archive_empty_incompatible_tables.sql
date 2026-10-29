DO $$
DECLARE
  table_name text;
  existing_count integer := 0;
  archived_count integer := 0;
  conflicting_tables text[] := ARRAY[
    'profiles', 'customers', 'documents', 'payments', 'expenses', 'suppliers'
  ];
BEGIN
  FOREACH table_name IN ARRAY conflicting_tables LOOP
    IF to_regclass(format('public.%I', table_name)) IS NOT NULL THEN
      existing_count := existing_count + 1;
    ELSIF to_regclass(format('public.legacy_invoices_%I', table_name)) IS NOT NULL THEN
      archived_count := archived_count + 1;
    END IF;
  END LOOP;

  IF existing_count = 0 AND archived_count = 0 THEN
    RETURN;
  END IF;
  IF existing_count = 0 AND archived_count = cardinality(conflicting_tables) THEN
    RETURN;
  END IF;
  IF existing_count <> cardinality(conflicting_tables) THEN
    RAISE EXCEPTION 'Conflicting public tables are in a partial archive state';
  END IF;

  EXECUTE 'LOCK TABLE public.profiles, public.customers, public.documents, public.payments, public.expenses, public.suppliers IN ACCESS EXCLUSIVE MODE';

  IF EXISTS (SELECT 1 FROM public.profiles)
    OR EXISTS (SELECT 1 FROM public.customers)
    OR EXISTS (SELECT 1 FROM public.documents)
    OR EXISTS (SELECT 1 FROM public.payments)
    OR EXISTS (SELECT 1 FROM public.expenses)
    OR EXISTS (SELECT 1 FROM public.suppliers) THEN
    RAISE EXCEPTION 'Refusing to archive non-empty conflicting public tables';
  END IF;

  ALTER TABLE public.profiles RENAME CONSTRAINT profiles_pkey TO legacy_invoices_profiles_pkey;
  ALTER TABLE public.customers RENAME CONSTRAINT customers_pkey TO legacy_invoices_customers_pkey;
  ALTER TABLE public.documents RENAME CONSTRAINT documents_pkey TO legacy_invoices_documents_pkey;
  ALTER TABLE public.payments RENAME CONSTRAINT payments_pkey TO legacy_invoices_payments_pkey;
  ALTER TABLE public.expenses RENAME CONSTRAINT expenses_pkey TO legacy_invoices_expenses_pkey;
  ALTER TABLE public.suppliers RENAME CONSTRAINT suppliers_pkey TO legacy_invoices_suppliers_pkey;

  ALTER TABLE public.profiles RENAME TO legacy_invoices_profiles;
  ALTER TABLE public.customers RENAME TO legacy_invoices_customers;
  ALTER TABLE public.documents RENAME TO legacy_invoices_documents;
  ALTER TABLE public.payments RENAME TO legacy_invoices_payments;
  ALTER TABLE public.expenses RENAME TO legacy_invoices_expenses;
  ALTER TABLE public.suppliers RENAME TO legacy_invoices_suppliers;
END
$$;
