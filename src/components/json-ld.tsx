// Renders a JSON-LD <script> tag for structured data.
// Renders nothing when data is null.

export function JsonLd({ data }: { data: object | null | undefined }) {
  if (!data) return null;
  return (
    <script
      type="application/ld+json"
      // The data is server-controlled — no untrusted user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
