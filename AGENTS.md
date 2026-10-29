<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Invoice detail pages live under the authenticated layout and use owner-scoped queries; document downloads are generated in the browser to keep account data private.
- Payment totals and status are maintained by database triggers, with ownership and balance validation in the same transaction to prevent invalid or concurrent overpayments.
- Keep Bun package downloads concurrency-limited to reduce registry rate limits without changing dependency versions or registry authentication.
- Platform administration uses separate RLS-protected queries and existing admin RPCs; workspace queries always explicitly filter by owner so admin read privileges never mix businesses in personal views.
