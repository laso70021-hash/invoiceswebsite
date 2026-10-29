# Swahivo: remaining phases

## Done
- Landing page, dashboard and admin screens based on your reference images
- Sign-in with email/password and Google
- Customers, new invoices, invoice details, payments, PDF invoices and receipts
- Package download fix

## Remaining
1. **Test with a real account.** You sign up once. Then I check the full flow: create a customer, create an invoice, finalize it, record a payment, and download the PDF.
2. **Lock the admin page.** At the moment, anyone who is signed in can open it. Only admins should get in.
3. **Return after sign-in.** After signing in, people should go back to the page they were trying to open.
4. **Require a customer on invoices.** An invoice can't be saved without a customer. Invoice list rows get View and Delete actions.
5. **Admin tools with real data.** Users, invoices and payments across all businesses. I need you to define what goes in this part.
6. **Sharing and links.** Add page titles and preview details for when links are shared.
7. **Later options.** Emailing invoices to customers, and the sidebar features marked "Soon".

## Technical details
- Admin check runs through the existing role function (has_role).
- Sign-in keeps a redirect search param.
- The routing test gets extended to cover the main pages.
