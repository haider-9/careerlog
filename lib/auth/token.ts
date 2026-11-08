import { createHmac, timingSafeEqual } from "node:crypto";

export const OWNER_SESSION_COOKIE = "careerlog_owner_session";
export const OWNER_SESSION_MAX_AGE = 60 * 60 * 24 * 7;

function getSessionSecret() {
  return process.env.BETTER_AUTH_SECRET;
}

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function constantTimeEqual(left: string, right: string) {
  const length = Math.max(Buffer.byteLength(left), Buffer.byteLength(right), 1);
  const leftBuffer = Buffer.alloc(length);
  const rightBuffer = Buffer.alloc(length);
  leftBuffer.write(left);
  rightBuffer.write(right);
  return timingSafeEqual(leftBuffer, rightBuffer) && left.length === right.length;
}

export function createOwnerSession(username: string) {
  const secret = getSessionSecret();
  if (!secret) throw new Error("BETTER_AUTH_SECRET is required to sign owner sessions.");

  const payload = Buffer.from(JSON.stringify({
    username,
    expiresAt: Date.now() + OWNER_SESSION_MAX_AGE * 1000,
  })).toString("base64url");

  return `${payload}.${sign(payload, secret)}`;
}

export function verifyOwnerSession(token?: string) {
  const username = process.env.OWNER_USERNAME;
  const secret = getSessionSecret();
  if (!token || !username || !secret || token.length > 2048) return false;

  const separator = token.lastIndexOf(".");
  if (separator <= 0) return false;

  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  if (!constantTimeEqual(signature, sign(payload, secret))) return false;

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      username?: unknown;
      expiresAt?: unknown;
    };
    return session.username === username && typeof session.expiresAt === "number" && session.expiresAt > Date.now();
  } catch {
    return false;
  }
}