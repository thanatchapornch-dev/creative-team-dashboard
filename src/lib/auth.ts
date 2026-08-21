import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

const COOKIE_NAME = "ctd_session";
const SESSION_SECRET = process.env.SESSION_SECRET ?? "dev-only-insecure-secret-change-me";
const secretKey = new TextEncoder().encode(SESSION_SECRET);

export type SessionPayload = {
  memberId: string;
};

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}

export async function createSession(memberId: string) {
  const token = await new SignJWT({ memberId } satisfies SessionPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secretKey);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey);
    if (typeof payload.memberId !== "string") return null;
    return { memberId: payload.memberId };
  } catch {
    return null;
  }
}

export async function getCurrentMember() {
  const session = await getSession();
  if (!session) return null;
  return prisma.member.findUnique({ where: { id: session.memberId } });
}

export async function requireMember() {
  const member = await getCurrentMember();
  if (!member) throw new Error("UNAUTHENTICATED");
  return member;
}

export async function requireRole(roles: Array<"MEMBER" | "LEADER" | "ADMIN">) {
  const member = await requireMember();
  if (!roles.includes(member.role)) throw new Error("FORBIDDEN");
  return member;
}
