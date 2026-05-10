// CMS auth — single shared password gate.
// Cookie: HMAC-SHA256-signed JWT (HS256) using CMS_SESSION_SECRET.
// Valid for 7 days, sliding (re-issued on every successful request).

import { SignJWT, jwtVerify } from "jose";
import { CMS_PASSWORD, CMS_SESSION_SECRET } from "./env";

export const CMS_COOKIE = "cms_session";
export const CMS_BASE = "/c4m5s6";
const SESSION_SECONDS = 60 * 60 * 24 * 7; // 7 days

function secretKey() {
  if (!CMS_SESSION_SECRET) {
    throw new Error("CMS_SESSION_SECRET env var is required");
  }
  return new TextEncoder().encode(CMS_SESSION_SECRET);
}

export async function issueCmsToken(): Promise<string> {
  return await new SignJWT({ role: "cms" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_SECONDS}s`)
    .sign(secretKey());
}

export async function verifyCmsToken(
  token: string | undefined | null,
): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return payload?.role === "cms";
  } catch {
    return false;
  }
}

export function checkPassword(input: unknown): boolean {
  if (typeof input !== "string" || input.length === 0) return false;
  if (!CMS_PASSWORD) return false;
  // constant-time compare
  if (input.length !== CMS_PASSWORD.length) return false;
  let diff = 0;
  for (let i = 0; i < input.length; i++) {
    diff |= input.charCodeAt(i) ^ CMS_PASSWORD.charCodeAt(i);
  }
  return diff === 0;
}

export const COOKIE_OPTS = {
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_SECONDS,
};
