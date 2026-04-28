import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "node:crypto";

const COOKIE_NAME = "sa_session";
const COOKIE_TTL_SECONDS = 30 * 24 * 60 * 60;

export type Role = "admin" | "user";
export type Session = {
  user: {
    email: string;
    name?: string | null;
    role: Role;
  };
};

export const isAuthDisabled = process.env.AUTH_DISABLED === "true";
const devUserEmail = process.env.DEV_USER_EMAIL ?? "dev@local";

if (isAuthDisabled && process.env.NODE_ENV === "production") {
  console.warn(
    "[auth] AUTH_DISABLED=true in PRODUCTION — gefährlich! Tool ist offen für jeden. Entferne diese ENV in Vercel.",
  );
}

function devSession(): Session {
  return {
    user: { email: devUserEmail, name: devUserEmail.split("@")[0], role: "admin" },
  };
}

function getSecret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET ist nicht gesetzt.");
  return s;
}

export function signToken(email: string): string {
  const expiresAt = Date.now() + COOKIE_TTL_SECONDS * 1000;
  const payload = `${email}|${expiresAt}`;
  const sig = crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");
  return Buffer.from(`${payload}|${sig}`).toString("base64url");
}

export function verifyToken(token: string): { email: string } | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const parts = decoded.split("|");
    if (parts.length !== 3) return null;
    const [email, expiresAtStr, sig] = parts;
    const expectedSig = crypto
      .createHmac("sha256", getSecret())
      .update(`${email}|${expiresAtStr}`)
      .digest("hex");
    if (sig.length !== expectedSig.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expectedSig, "hex"))) return null;
    if (Number(expiresAtStr) < Date.now()) return null;
    return { email };
  } catch {
    return null;
  }
}

export async function auth(): Promise<Session | null> {
  if (isAuthDisabled) return devSession();
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const verified = verifyToken(token);
  if (!verified) return null;
  return {
    user: { email: verified.email, name: verified.email.split("@")[0], role: "admin" },
  };
}

export function checkPassword(password: string): boolean {
  const expected = process.env.APP_PASSWORD;
  if (!expected) return false;
  if (password.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(password, "utf-8"), Buffer.from(expected, "utf-8"));
}

export async function loginWithPassword(password: string, email = "user@local"): Promise<boolean> {
  if (!checkPassword(password)) return false;
  const token = signToken(email);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_TTL_SECONDS,
  });
  return true;
}

export async function signOut(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  redirect("/login");
}

// Cookie-Name als Konstante für Middleware
export const SESSION_COOKIE_NAME = COOKIE_NAME;
