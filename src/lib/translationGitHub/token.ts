import { createSign } from "node:crypto";
import { getTranslationGitHubConfig } from "./config";

const GITHUB_API_VERSION = "2022-11-28";
const encoder = new TextEncoder();

const encodeBase64Url = (value: Uint8Array | string) => {
  const bytes = typeof value === "string" ? encoder.encode(value) : value;
  return Buffer.from(bytes).toString("base64url");
};

const createAppJwt = () => {
  const { appId, privateKey } = getTranslationGitHubConfig();
  const now = Math.floor(Date.now() / 1000);
  const header = encodeBase64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = encodeBase64Url(
    JSON.stringify({
      iat: now - 60,
      exp: now + 9 * 60,
      iss: appId,
    }),
  );
  const unsignedToken = `${header}.${payload}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsignedToken);
  signer.end();
  const signature = signer.sign(privateKey);

  return `${unsignedToken}.${encodeBase64Url(signature)}`;
};

type InstallationTokenResponse = {
  token?: string;
  expires_at?: string;
};

export const createInstallationToken = async () => {
  const { installationId } = getTranslationGitHubConfig();
  const response = await fetch(
    `https://api.github.com/app/installations/${encodeURIComponent(installationId)}/access_tokens`,
    {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${createAppJwt()}`,
        "User-Agent": "nepali.no-translation-editor",
        "X-GitHub-Api-Version": GITHUB_API_VERSION,
      },
      signal: AbortSignal.timeout(10_000),
    },
  );

  if (!response.ok) {
    throw new Error(`GitHubInstallationTokenFailed:${response.status}`);
  }

  const body = (await response.json()) as InstallationTokenResponse;

  if (!body.token || !body.expires_at) {
    throw new Error("GitHubInstallationTokenInvalid");
  }

  return {
    token: body.token,
    expiresAt: body.expires_at,
  };
};

export const githubInstallationRequest = async (
  path: string,
  init: RequestInit = {},
) => {
  if (!path.startsWith("/")) {
    throw new Error("GitHubPathMustBeAbsolute");
  }

  const { token } = await createInstallationToken();

  return fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "nepali.no-translation-editor",
      "X-GitHub-Api-Version": GITHUB_API_VERSION,
      ...init.headers,
    },
    signal: init.signal ?? AbortSignal.timeout(10_000),
  });
};
