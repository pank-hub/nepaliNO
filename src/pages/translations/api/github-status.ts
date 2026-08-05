import type { APIRoute } from "astro";
import { readTranslationSession } from "../../../lib/translationAuth/session";
import { readTranslationRepositoryStatus } from "../../../lib/translationGitHub/readRepository";

export const prerender = false;

const jsonResponse = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });

export const GET: APIRoute = async ({ cookies }) => {
  const session = await readTranslationSession(cookies);

  if (!session) {
    return jsonResponse(401, {
      ok: false,
      code: "authentication_required",
      message: "Sign in before checking repository connectivity.",
    });
  }

  try {
    const status = await readTranslationRepositoryStatus();

    return jsonResponse(200, {
      ok: true,
      code: "github_repository_connected",
      message: "The Translation Editor can read the fixed repository boundary.",
      status,
    });
  } catch (error) {
    console.error("Translation GitHub connectivity check failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
      errorMessage: error instanceof Error ? error.message : "Unknown failure",
    });

    return jsonResponse(503, {
      ok: false,
      code: "github_repository_unavailable",
      message: "The Translation Editor could not verify repository connectivity.",
    });
  }
};

export const ALL: APIRoute = async () =>
  jsonResponse(405, {
    ok: false,
    code: "method_not_allowed",
    message: "Method not allowed.",
  });
