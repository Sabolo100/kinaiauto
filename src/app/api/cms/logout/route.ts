import { NextResponse } from "next/server";
import { CMS_BASE, CMS_COOKIE } from "@/lib/cms-auth";

export const runtime = "nodejs";

export async function POST() {
  const res = NextResponse.redirect(
    new URL(`${CMS_BASE}/login`, process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  );
  res.cookies.set(CMS_COOKIE, "", { path: CMS_BASE, maxAge: 0 });
  return res;
}
