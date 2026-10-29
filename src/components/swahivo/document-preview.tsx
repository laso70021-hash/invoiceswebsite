import { parseCustomization } from "@/lib/branding";
import type { CSSProperties } from "react";
import { businessLines, designPalette, type DesignedDocument } from "@/lib/document-design";
import { balance, lineAmount, money } from "@/lib/invoice-math";

export function DocumentPreview({
  document: d,
  style,
}: {
  document: DesignedDocument;
  style?: string | undefined;
}) {
  const palette = designPalette(d.business, style);
  const custom = parseCustomization(d.business.document_customization);
  const vars = {
    "--doc-ink": palette.ink,
    "--doc-font":
      custom.font === "serif"
        ? "Georgia, serif"
        : custom.font === "mono"
          ? "monospace"
          : "Arial, sans-serif",
    "--doc-padding": custom.density === "compact" ? "7px" : "13px",
    "--doc-accent": palette.accent,
    "--doc-pale": palette.pale,
    "--doc-header": palette.header,
    "--doc-header-text": palette.headerText,
  } as CSSProperties;
  return (
    <div className="overflow-x-auto rounded-xl border bg-slate-100 p-3 sm:p-6">
      <article
        className="swahivo-document mx-auto max-w-[794px] bg-white shadow-lg"
        style={vars}
        aria-label={`${d.title} preview`}
      >
        <header className="doc-heading">
          <div>
            {d.business.logo_url && (
              <img className="doc-logo" src={d.business.logo_url} alt="Business logo" />
            )}
            <strong className="doc-brand">{d.business.business_name || "Your business"}</strong>
            <p>Business made simple</p>
          </div>
          <span>{custom.heading || d.title}</span>
        </header>
        <div className="doc-body">
          <div className="doc-meta">
            <span>{d.number || "Number assigned on save"}</span>
            <div>
              Issued: {d.issueDate}
              {d.dueDate && (
                <>
                  <br />
                  {d.dueLabel || "Due date"}: {d.dueDate}
                </>
              )}
            </div>
          </div>
          <div className="doc-parties">
            <section>
              <h3>From</h3>
              <strong>{d.business.business_name || "Your business"}</strong>
              {businessLines(d.business).map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </section>
            <section>
              <h3>{d.partyLabel || "Bill to"}</h3>
              <strong>{d.party || "Customer name"}</strong>
              <p>{d.partyDetails}</p>
            </section>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Description</th>
                <th className="doc-number">Qty</th>
                {d.priced !== false && (
                  <>
                    <th className="doc-number">Unit price</th>
                    <th className="doc-number">Discount</th>
                    <th className="doc-number">Amount</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {d.items.map((item, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{item.description || "Item description"}</td>
                  <td className="doc-number">{item.qty}</td>
                  {d.priced !== false && (
                    <>
                      <td className="doc-number">{money(item.price, d.currency)}</td>
                      <td className="doc-number">{item.discount}%</td>
                      <td className="doc-number">{money(lineAmount(item), d.currency)}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="doc-summary">
            <section>
              {d.business.payment_instructions && d.priced !== false && (
                <>
                  <h3>Payment information</h3>
                  <p>{d.business.payment_instructions}</p>
                </>
              )}
              {d.notes && (
                <>
                  <h3>Notes & terms</h3>
                  <p>{d.notes}</p>
                </>
              )}
            </section>
            {d.priced !== false && (
              <dl>
                <div>
                  <dt>Subtotal</dt>
                  <dd>{money(d.subtotal, d.currency)}</dd>
                </div>
                <div>
                  <dt>Tax ({d.taxRate}%)</dt>
                  <dd>{money(d.tax, d.currency)}</dd>
                </div>
                <div className="doc-total">
                  <dt>Total</dt>
                  <dd>{money(d.total, d.currency)}</dd>
                </div>
                {d.paid !== undefined && (
                  <>
                    <div>
                      <dt>Amount paid</dt>
                      <dd>{money(d.paid, d.currency)}</dd>
                    </div>
                    <div>
                      <dt>Balance due</dt>
                      <dd>{money(balance(d.total, d.paid), d.currency)}</dd>
                    </div>
                  </>
                )}
              </dl>
            )}
          </div>
          {d.priced === false && (
            <p className="mt-10">Received by: ____________________ &nbsp; Date: ______________</p>
          )}
          <footer>{custom.footer ?? "Thank you for your business."}</footer>
        </div>
      </article>
    </div>
  );
}
