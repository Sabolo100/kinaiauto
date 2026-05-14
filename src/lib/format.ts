// Hungarian-locale formatting helpers used across the UI.

// Default EU segment letter for each category slug.
// Per-model overrides are stored in models.segment; use catLabel() to display.
export const CATEGORY_SEGMENT: Record<string, string> = {
  "varosi-kisauto":    "A",
  "mini-suv":          "B",
  "kompakt-suv":       "C",
  "kozepmeretu-suv":   "D",
  "nagy-suv":          "J",
  "kompakt-ferdehatu": "C",
  "premium-limuzin":   "F",
  "kombi":             "D",
  "mpv":               "M",
  "pickup":            "J",
  "sedan":             "D",
  "roadster":          "S",
};

/** "Kompakt SUV (C)" — appends segment letter in brackets when present. */
export function catLabel(
  category: string,
  segment: string | null | undefined,
): string {
  return segment ? `${category} (${segment})` : category;
}

export function fmtPrice(v: number | null | undefined): string {
  if (v == null) return "—";
  return `${v.toFixed(1).replace(".", ",")} M Ft`;
}

export function fmtMFt(v: number): string {
  return v.toFixed(1).replace(/\.0$/, "").replace(".", ",");
}

export function fmtNumber(v: number | null | undefined): string {
  if (v == null) return "—";
  return v.toLocaleString("hu-HU");
}

export function fmtUnit(
  v: number | null | undefined,
  key:
    | "priceMin"
    | "priceMax"
    | "length"
    | "trunk"
    | "range"
    | "power"
    | "seats"
    | "battery"
    | "acceleration",
): string {
  if (v == null) return "—";
  switch (key) {
    case "priceMin":
    case "priceMax":
      return fmtPrice(v);
    case "length":
      return `${fmtNumber(v)} mm`;
    case "trunk":
      return `${fmtNumber(v)} l`;
    case "range":
      return `${v} km`;
    case "power":
      return `${v} LE`;
    case "seats":
      return `${v} ülés`;
    case "battery":
      return `${v.toString().replace(".", ",")} kWh`;
    case "acceleration":
      return `${v.toString().replace(".", ",")} s`;
  }
}

// "Brand·Model Name" → encoded URL param
export function encodeCompareToken(brand: string, name: string): string {
  return `${encodeURIComponent(brand)}|${encodeURIComponent(name)}`;
}

export function parseCompareTokens(raw: string | null) {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => {
      const [brand, name] = s.split("|").map((p) => decodeURIComponent(p));
      return { brand, name };
    })
    .filter((c) => c.brand && c.name);
}

// "Hu" sentence-ish lowercase initials for badge fallbacks
export function brandInitials(s: string): string {
  if (s.length <= 4) return s;
  return s
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}
