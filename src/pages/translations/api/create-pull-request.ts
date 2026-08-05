import type { APIRoute } from "astro";
import { readTranslationSession } from "../../../lib/translationAuth/session";
import { getTranslationDiagnostics } from "../../../lib/translationBrowser/diagnostics";
import { validateTranslationProposal } from "../../../lib/translationBrowser/validateProposal";
import { createTranslationPullRequest } from "../../../lib/translationGitHub/createPullRequest";

export const prerender = false;

const MAX_REQUEST_BYTES = 128 * 1024;

const jsonResponse = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });

export const POST: APIRoute = async ({ cookies, request, url }) => {
  const session = await readTranslationSession(cookies);
  if (!session) {
    return jsonResponse(401, {
      ok: false,
      code: "authentication_required",
      message: "Sign in again before creating a translation pull request.",
    });
  }

  const origin = request.headers.get("origin");
  if (!origin || origin !== url.origin) {
    return jsonResponse(403, {
      ok: false,
      code: "invalid_origin",
      message: "The request origin could not be verified.",
    });
  }

  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("application/json")) {
    return jsonResponse(415, {
      ok: false,
      code: "unsupported_media_type",
      message: "This endpoint accepts JSON requests only.",
    });
  }

  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BYTES) {
    return jsonResponse(413, {
      ok: false,
      code: "request_too_large",
      message: "The translation proposal is too large.",
    });
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return jsonResponse(400, {
      ok: false,
      code: "invalid_request",
      message: "The request could not be read.",
    });
  }

  if (Buffer.byteLength(rawBody, "utf8") > MAX_REQUEST_BYTES) {
    return jsonResponse(413, {
      ok: false,
      code: "request_too_large",
      message: "The translation proposal is too large.",
    });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return jsonResponse(400, {
      ok: false,
      code: "invalid_json",
      message: "The request body is not valid JSON.",
    });
  }

  const validation = validateTranslationProposal(payload);
  if (!validation.ok) {
    return jsonResponse(400, {
      ok: false,
      code: "validation_failed",
      message: "Review the proposed translation changes.",
      errors: validation.errors,
    });
  }

  const diagnostics = getTranslationDiagnostics();
  if (
    diagnostics.unassignedSections.length > 0 ||
    diagnostics.structuralIssues.length > 0
  ) {
    return jsonResponse(409, {
      ok: false,
      code: "translation_registry_review_required",
      message: "Resolve Translation registry warnings before creating a pull request.",
    });
  }

  try {
    const result = await createTranslationPullRequest({
      language: validation.language,
      moduleId: validation.moduleId,
      changes: validation.changes,
    });

    return jsonResponse(201, {
      ok: true,
      code: "translation_pull_request_created",
      message: "A protected translation pull request was created for manual review.",
      result,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown failure";
    console.error("Translation pull request creation failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
      errorMessage,
    });

    if (errorMessage.startsWith("StaleTranslationSource:")) {
      return jsonResponse(409, {
        ok: false,
        code: "stale_source",
        message: "The translation source changed. Reload the module and review it again.",
      });
    }

    return jsonResponse(503, {
      ok: false,
      code: "translation_pull_request_failed",
      message: "The protected translation pull request could not be created.",
    });
  }
};

export const ALL: APIRoute = async () =>
  jsonResponse(405, {
    ok: false,
    code: "method_not_allowed",
    message: "Method not allowed.",
  });
