import "server-only";

import { cookies } from "next/headers";

import { OWNER_SESSION_COOKIE, verifyOwnerSession } from "@/lib/auth/token";

export { createOwnerSession, OWNER_SESSION_COOKIE, OWNER_SESSION_MAX_AGE } from "@/lib/auth/token";

export async function hasOwnerSession() {
  const cookieStore = await cookies();
  return verifyOwnerSession(cookieStore.get(OWNER_SESSION_COOKIE)?.value);
}