import type { APIRoute } from "astro";
import { buildGitHubAuthorizationUrl } from "../../../../lib/translationAuth/github";

export const prerender = false;

const OAUTH_STATE_COOKIE = "nepali_no_translation_oauth_state";

export const GET: APIRoute = async ({ cookies, redirect, url }) => {
  const state = crypto.randomUUID();

  cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/api/translations/auth",
    maxAge: 60 * 10,
  });

  return redirect(buildGitHubAuthorizationUrl(url.origin, state).toString(), 302);
};

export const ALL: APIRoute = async () =>
  new Response("Method not allowed.", {
    status: 405,
    headers: { "cache-control": "no-store" },
  });
