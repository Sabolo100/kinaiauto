import { NextRequest, NextResponse } from "next/server";
import {
  CMS_COOKIE,
  COOKIE_OPTS,
  checkPassword,
  issueCmsToken,
} from "@/lib/cms-auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let password: unknown;
  try {
    const j = await req.json();
    password = j.password;
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  if (!checkPassword(password)) {
    return NextResponse.json({ error: "Hibás jelszó" }, { status: 401 });
  }

  const token = await issueCmsToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(CMS_COOKIE, token, COOKIE_OPTS);
  return res;
}
