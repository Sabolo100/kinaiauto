import Link from "next/link";

export function LegalPage({
  title,
  date = "2026. május 14.",
  children,
}: {
  title: string;
  date?: string;
  children: React.ReactNode;
}) {
  return (
    <main>
      <section className="pagehead">
        <div className="container">
          <div className="breadcrumbs">
            <Link href="/">Főoldal</Link> · {title}
          </div>
          <h1 className="legal-h1">{title}</h1>
          <p className="legal-meta">Hatályos: {date} · kinaiauto.com</p>
        </div>
      </section>
      <section style={{ padding: "48px 0 96px" }}>
        <div className="container">
          <div className="legal-body">{children}</div>
        </div>
      </section>
    </main>
  );
}
