import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/json-ld";
import { articleSchema, breadcrumbSchema } from "@/lib/seo";
import { SITE_URL } from "@/lib/env";
import { getArticleIndex } from "@/lib/data";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const idx = await getArticleIndex();
  return idx.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const idx = await getArticleIndex();
  const a = idx.find((x) => x.slug === slug);
  if (!a) return { title: "Cikk" };
  return {
    title: a.title,
    description: a.excerpt,
    alternates: { canonical: `${SITE_URL}/tudastar/${slug}` },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const idx = await getArticleIndex();
  const a = idx.find((x) => x.slug === slug);
  if (!a) notFound();

  return (
    <main>
      <section className="pagehead">
        <div className="container">
          <div className="breadcrumbs">
            <Link href="/">Főoldal</Link> · <Link href="/tudastar">Tudástár</Link> · {a.title}
          </div>
          <div className="eyebrow">{a.num}</div>
          <h1>{a.title}</h1>
          <p className="lede">{a.excerpt}</p>
        </div>
      </section>

      <article className="container" style={{ paddingBottom: 80 }}>
        <p className="body" style={{ maxWidth: 720 }}>
          A részletes cikk hamarosan elérhető lesz ezen a címen. Addig is
          látogass el a <Link href="/tudastar" style={{ color: "var(--accent-ink)", textDecoration: "underline" }}>Tudástár főoldalra</Link>,
          ahol a {a.num.split(" · ")[1]?.toLowerCase() ?? "téma"} fő tudnivalói
          összefoglalva megtalálhatók.
        </p>

        <div
          style={{
            marginTop: 48,
            padding: 24,
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: 6,
          }}
        >
          <h3
            style={{
              fontFamily: "var(--font-instrument), serif",
              fontSize: 22,
              fontWeight: 400,
              margin: "0 0 8px",
            }}
          >
            Visszatérünk hamarosan
          </h3>
          <p style={{ fontSize: 14, color: "var(--ink-soft)", margin: 0 }}>
            Az oldal CMS-én keresztül szerkesztjük majd ezeket a hosszabb
            cikkeket. Addig a fő Tudástárban összefoglaló formában
            megtalálsz mindent.
          </p>
        </div>
      </article>

      <JsonLd
        data={articleSchema({
          title: a.title,
          description: a.excerpt,
          url: `${SITE_URL}/tudastar/${slug}`,
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Főoldal", url: "/" },
          { name: "Tudástár", url: "/tudastar" },
          { name: a.title, url: `/tudastar/${slug}` },
        ])}
      />
    </main>
  );
}
