import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createOwnerSession, OWNER_SESSION_COOKIE, OWNER_SESSION_MAX_AGE } from "@/lib/auth/session";

function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!origin || !appUrl) return false;

  try {
    return origin === new URL(request.url).origin || origin === new URL(appUrl).origin;
  } catch {
    return false;
  }
}

function constantTimeEqual(left: string, right: string) {
  const length = Math.max(Buffer.byteLength(left), Buffer.byteLength(right), 1);
  const leftBuffer = Buffer.alloc(length);
  const rightBuffer = Buffer.alloc(length);
  leftBuffer.write(left);
  rightBuffer.write(right);
  return timingSafeEqual(leftBuffer, rightBuffer) && left.length === right.length;
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const expectedUsername = process.env.OWNER_USERNAME;
  const expectedPassword = process.env.OWNER_PASSWORD;
  const sessionSecret = process.env.BETTER_AUTH_SECRET;
  if (!expectedUsername || !expectedPassword || !sessionSecret) {
    return NextResponse.json({ error: "Owner login is not configured." }, { status: 503 });
  }

  let credentials: { username?: unknown; password?: unknown };
  try {
    credentials = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (typeof credentials.username !== "string" || typeof credentials.password !== "string" || credentials.username.length > 256 || credentials.password.length > 1024) {
    return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
  }

  const validUsername = constantTimeEqual(credentials.username, expectedUsername);
  const validPassword = constantTimeEqual(credentials.password, expectedPassword);
  if (!validUsername || !validPassword) {
    return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(OWNER_SESSION_COOKIE, createOwnerSession(expectedUsername), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: OWNER_SESSION_MAX_AGE,
  });
  return response;
}

export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(OWNER_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}