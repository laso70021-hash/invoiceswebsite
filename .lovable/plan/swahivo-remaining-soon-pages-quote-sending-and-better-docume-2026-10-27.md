# Swahivo: remaining "Soon" pages, quote sending, and better document designs

Everything below is new work. Pages that already work (invoices, customers, the 5 document types, receipts, All Tools, admin) are reused, not rebuilt.

## Phase 1 — Send quotes and turn them into invoices (the "Send Quote for Free" feature)
- Each quotation gets a **Send** button that creates a share link the customer can open without signing in (read-only page showing the quote, with Accept / Decline buttons).
- Quote status: Draft, Sent, Accepted, Declined, Converted.
- **Convert to Invoice** button on a quote: copies the customer, items, tax and notes into a new invoice in one click and links the two.
- Same convert option for Proforma Invoices.
- Sending by email comes later (needs an email domain); for now the link can be copied or shared on WhatsApp.

## Phase 2 — Document designs from your reference photos
Each document type gets its own layout in the PDF, following the uploaded templates and your field list:
- **Invoice / Tax Invoice:** seller and customer tax numbers (TIN/VRN), payment terms, payment instructions, paid and balance.
- **Proforma:** validity, delivery date, shipping info, note "This is not a tax invoice or proof of payment".
- **Quotation:** validity, delivery timeline, terms, customer acceptance signature block.
- **Receipt:** receipt number, payer, amount received, method, reference number, invoice reference, remaining balance, issued-by.
- **Purchase Order:** buyer/supplier, delivery and billing address, delivery instructions, conditions, approval signature.
- **Delivery Note:** linked order number, ordered / delivered / back-ordered quantities, prepared-by, dispatched-by, received-by signatures.
- Shared look: business logo, colored header band, aligned number columns, same date and currency format. Missing details print as clear placeholders, never invented.
- The new fields are added to the create forms of each document type.

## Phase 3 — Business setup
- **Business Settings:** business name, logo upload, address, phone, email, TIN/VRN, currency, default tax rate, payment instructions (used on every document).
- **Templates:** choose a color and layout style for documents, with a live preview.
- **Team Members:** invite people by email with Admin or Staff access to the same business.

## Phase 4 — Catalog
- **Products** and **Services:** saved items with name, price, unit, tax; pick them when filling any document instead of retyping.
- **Inventory:** stock count per product, reduced by delivery notes, increased by purchase orders received; low-stock warning.

## Phase 5 — Sales and purchases
- **Payments:** one list of all payments received across invoices, with filters by date and method (Receipts stays as the PDF view).
- **Recurring Billing:** schedule an invoice to repeat weekly/monthly; a daily job creates the next one automatically.
- **Suppliers:** supplier list, used by purchase orders (like customers for sales).
- **Purchase Orders (Purchases group):** links to the existing purchase order page.
- **Expenses:** record spending with category, supplier, date, amount, optional receipt photo.

## Phase 6 — Finance
- **Reports:** sales by month, money collected, unpaid balances by customer, expenses by category, profit (sales minus expenses), with date range and CSV download.
- **Accounting:** simple income vs expenses ledger and tax summary (tax collected on invoices vs tax paid on purchases).

## Order and checks
Build phases in order; each phase is tested signed in as your account before moving on. Tax rules are kept generic (TZ defaults like 18% VAT stay editable) — no legal compliance claims.

## Technical notes
- New tables: business settings fields on profiles, products, suppliers, expenses, stock movements, recurring schedules, team memberships, quote share tokens; all owner-scoped with RLS and grants.
- Public quote page under a non-auth route reads only by an unguessable token via a narrow server function; accept/decline goes through the same token.
- Recurring billing via a scheduled server route under the public api path with secret verification.
- Logos stored in Cloud storage (private bucket, signed URLs). PDFs stay generated in the browser with jspdf, one layout function per document kind.
- Team members: owners and staff share a business id; existing owner-filtered queries switch to business-scoped filters.
