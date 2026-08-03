import type { APIRoute } from "astro";
import { getTranslationAuthConfig } from "../../../../lib/translationAuth/config";
import { exchangeCodeForGitHubIdentity } from "../../../../lib/translationAuth/github";
import { createTranslationSession } from "../../../../lib/translationAuth/session";

export const prerender = false;

const OAUTH_STATE_COOKIE = "nepali_no_translation_oauth_state";

const denied = (origin: string, reason: string) => {
  const url = new URL("/translations/denied/", origin);
  url.searchParams.set("reason", reason);
  return Response.redirect(url, 302);
};

export const GET: APIRoute = async ({ cookies, url }) => {
  const expectedState = cookies.get(OAUTH_STATE_COOKIE)?.value;
  cookies.delete(OAUTH_STATE_COOKIE, { path: "/api/translations/auth" });

  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  const oauthError = url.searchParams.get("error");

  if (oauthError) {
    return denied(url.origin, "github_cancelled");
  }

  if (!expectedState || !state || state !== expectedState || !code) {
    return denied(url.origin, "invalid_callback");
  }

  try {
    const identity = await exchangeCodeForGitHubIdentity(code, url.origin);
    const { allowedGitHubUserId } = getTranslationAuthConfig();

    if (identity.githubUserId !== allowedGitHubUserId) {
      console.warn("Translation portal access denied");
      return denied(url.origin, "not_authorized");
    }

    await createTranslationSession(cookies, identity);
    return Response.redirect(new URL("/translations/", url.origin), 302);
  } catch (error) {
    console.error("Translation authentication failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return denied(url.origin, "authentication_failed");
  }
};

export const ALL: APIRoute = async () =>
  new Response("Method not allowed.", {
    status: 405,
    headers: { "cache-control": "no-store" },
  });
