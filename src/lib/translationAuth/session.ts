import type { AstroCookies } from "astro";
import { getTranslationAuthConfig } from "./config";

const SESSION_COOKIE = "nepali_no_translation_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 4;
const encoder = new TextEncoder();

type TranslationSession = {
  githubUserId: string;
  login: string;
  expiresAt: number;
};

const encodeBase64Url = (value: Uint8Array | string) => {
  const bytes = typeof value === "string" ? encoder.encode(value) : value;
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/u, "");
};

const decodeBase64Url = (value: string) => {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

const signingKey = async () =>
  crypto.subtle.importKey(
    "raw",
    encoder.encode(getTranslationAuthConfig().sessionSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );

const sign = async (payload: string) => {
  const signature = await crypto.subtle.sign(
    "HMAC",
    await signingKey(),
    encoder.encode(payload),
  );

  return encodeBase64Url(new Uint8Array(signature));
};

const verify = async (payload: string, signature: string) => {
  try {
    const normalized = signature.replaceAll("-", "+").replaceAll("_", "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));

    return crypto.subtle.verify(
      "HMAC",
      await signingKey(),
      bytes,
      encoder.encode(payload),
    );
  } catch {
    return false;
  }
};

export const createTranslationSession = async (
  cookies: AstroCookies,
  identity: { githubUserId: string; login: string },
) => {
  const session: TranslationSession = {
    ...identity,
    expiresAt: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  };
  const payload = encodeBase64Url(JSON.stringify(session));
  const signature = await sign(payload);

  cookies.set(SESSION_COOKIE, `${payload}.${signature}`, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/translations",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
};

export const readTranslationSession = async (
  cookies: AstroCookies,
): Promise<TranslationSession | null> => {
  const value = cookies.get(SESSION_COOKIE)?.value;

  if (!value) {
    return null;
  }

  const [payload, signature, extra] = value.split(".");

  if (!payload || !signature || extra || !(await verify(payload, signature))) {
    return null;
  }

  try {
    const parsed = JSON.parse(decodeBase64Url(payload)) as Partial<TranslationSession>;
    const now = Math.floor(Date.now() / 1000);

    if (
      typeof parsed.githubUserId !== "string" ||
      typeof parsed.login !== "string" ||
      typeof parsed.expiresAt !== "number" ||
      parsed.expiresAt <= now ||
      parsed.githubUserId !== getTranslationAuthConfig().allowedGitHubUserId
    ) {
      return null;
    }

    return parsed as TranslationSession;
  } catch {
    return null;
  }
};

export const clearTranslationSession = (cookies: AstroCookies) => {
  cookies.delete(SESSION_COOKIE, { path: "/translations" });
};
