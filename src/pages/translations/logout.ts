import type { APIRoute } from "astro";
import { clearTranslationSession } from "../../lib/translationAuth/session";

export const prerender = false;

export const GET: APIRoute = ({ cookies, redirect }) => {
  clearTranslationSession(cookies);
  return redirect("/translations/login/", 302);
};

export const ALL: APIRoute = async () =>
  new Response("Method not allowed.", {
    status: 405,
    headers: { "cache-control": "no-store" },
  });
