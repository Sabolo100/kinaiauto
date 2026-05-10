// Protect /c4m5s6/* — except /c4m5s6/login and /c4m5s6/api/login.
// Redirect to /c4m5s6/login if no valid session cookie.

import { NextRequest, NextResponse } from "next/server";
import { CMS_BASE, CMS_COOKIE, verifyCmsToken } from "./lib/cms-auth";

const PUBLIC_CMS_PATHS = new Set<string>([
  `${CMS_BASE}/login`,
]);

const PUBLIC_API_PATHS = new Set<string>([
  "/api/cms/login",
  "/api/cms/logout",
]);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only run on CMS namespace
  const isCms = pathname === CMS_BASE || pathname.startsWith(`${CMS_BASE}/`);
  const isCmsApi = pathname.startsWith("/api/cms/");
  if (!isCms && !isCmsApi) return NextResponse.next();

  // Public CMS paths
  if (PUBLIC_CMS_PATHS.has(pathname)) return NextResponse.next();
  if (PUBLIC_API_PATHS.has(pathname)) return NextResponse.next();

  const token = req.cookies.get(CMS_COOKIE)?.value;
  const ok = await verifyCmsToken(token);

  if (!ok) {
    if (isCmsApi) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = `${CMS_BASE}/login`;
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/c4m5s6/:path*", "/api/cms/:path*"],
};
