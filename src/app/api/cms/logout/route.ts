import { NextResponse } from "next/server";
import { CMS_BASE, CMS_COOKIE } from "@/lib/cms-auth";

export const runtime = "nodejs";

export async function POST() {
  const res = NextResponse.redirect(
    new URL(`${CMS_BASE}/login`, process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  );
  // Clear cookie on both paths (transition: old /c4m5s6, new /)
  res.cookies.set(CMS_COOKIE, "", { path: "/", maxAge: 0, httpOnly: true, secure: true, sameSite: "lax" });
  res.cookies.set(CMS_COOKIE, "", { path: CMS_BASE, maxAge: 0, httpOnly: true, secure: true, sameSite: "lax" });
  return res;
}
