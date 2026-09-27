// Visible FAQ (native <details>, no JS) + the matching FAQPage JSON-LD.
// The same items feed both, so the marked-up questions are always visible.

import { JsonLd } from "./json-ld";
import { faqSchema } from "@/lib/seo";
import type { FaqItem } from "@/lib/answers";

export function FaqList({
  items,
  step,
  title,
  sub,
  id = "gyik",
}: {
  items: FaqItem[];
  step?: string;
  title?: React.ReactNode;
  sub?: string;
  id?: string;
}) {
  if (!items.length) return null;
  return (
    <section className="block faq-block" id={id}>
      <div className="container">
        <div className="block-head">
          <div>
            {step ? <div className="step">{step}</div> : null}
            <h2>{title ?? <>Gyakori <em>kérdések</em>.</>}</h2>
          </div>
          {sub ? <div className="sub">{sub}</div> : null}
        </div>
        <div className="faq-list">
          {items.map((it, i) => (
            <details key={it.question} className="faq-item" open={i === 0}>
              <summary>{it.question}</summary>
              <p>{it.answer}</p>
            </details>
          ))}
        </div>
      </div>
      <JsonLd data={faqSchema(items)} />
    </section>
  );
}
