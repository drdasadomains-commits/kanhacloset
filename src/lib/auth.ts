import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

// Separate cookies and secrets for admin vs customer so an admin session can
// never be mistaken for a customer session or vice versa.
const ADMIN_COOKIE = "kc_admin";
const CUSTOMER_COOKIE = "kc_session";
const ISSUER = "kanhacloset";

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) throw new Error("AUTH_SECRET missing or too short (min 16 chars)");
  return new TextEncoder().encode(s);
}

export type SessionPayload = { sub: string; email: string; name?: string; role: "ADMIN" | "SUPERADMIN" | "CUSTOMER" };

async function sign(payload: SessionPayload, ttl: string) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(ttl)
    .sign(secret());
}

async function verify(token?: string): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { issuer: ISSUER });
    const { sub, email, name, role } = payload as Record<string, unknown>;
    if (typeof sub !== "string" || typeof email !== "string") return null;
    if (role !== "ADMIN" && role !== "SUPERADMIN" && role !== "CUSTOMER") return null;
    return { sub, email, name: typeof name === "string" ? name : undefined, role };
  } catch {
    return null;
  }
}

const secureCookie = process.env.NODE_ENV === "production";

export async function createAdminSession(payload: SessionPayload) {
  (await cookies()).set(ADMIN_COOKIE, await sign(payload, "8h"), {
    httpOnly: true, secure: secureCookie, sameSite: "lax", path: "/",
  });
}
export async function getAdminSession(): Promise<SessionPayload | null> {
  return verify((await cookies()).get(ADMIN_COOKIE)?.value);
}
export async function destroyAdminSession() {
  (await cookies()).delete(ADMIN_COOKIE);
}

export async function createCustomerSession(payload: SessionPayload) {
  (await cookies()).set(CUSTOMER_COOKIE, await sign(payload, "30d"), {
    httpOnly: true, secure: secureCookie, sameSite: "lax", path: "/",
  });
}
export async function getCustomerSession(): Promise<SessionPayload | null> {
  return verify((await cookies()).get(CUSTOMER_COOKIE)?.value);
}
export async function destroyCustomerSession() {
  (await cookies()).delete(CUSTOMER_COOKIE);
}
