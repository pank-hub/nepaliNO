import { getTranslationAuthConfig } from "./config";

const TOKEN_ENDPOINT = "https://github.com/login/oauth/access_token";
const USER_ENDPOINT = "https://api.github.com/user";

type GitHubTokenResponse = {
  access_token?: string;
  error?: string;
};

type GitHubUserResponse = {
  id?: number;
  login?: string;
};

export const buildGitHubAuthorizationUrl = (
  origin: string,
  state: string,
) => {
  const { clientId } = getTranslationAuthConfig();
  const url = new URL("https://github.com/login/oauth/authorize");

  url.searchParams.set("client_id", clientId);
  url.searchParams.set(
    "redirect_uri",
    `${origin}/api/translations/auth/callback`,
  );
  url.searchParams.set("state", state);

  return url;
};

export const exchangeCodeForGitHubIdentity = async (
  code: string,
  origin: string,
) => {
  const { clientId, clientSecret } = getTranslationAuthConfig();
  const tokenResponse = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": "nepali.no-translation-editor",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: `${origin}/api/translations/auth/callback`,
    }),
    signal: AbortSignal.timeout(8_000),
  });

  if (!tokenResponse.ok) {
    throw new Error("GitHubTokenExchangeFailed");
  }

  const token = (await tokenResponse.json()) as GitHubTokenResponse;

  if (!token.access_token || token.error) {
    throw new Error("GitHubTokenExchangeFailed");
  }

  const userResponse = await fetch(USER_ENDPOINT, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token.access_token}`,
      "User-Agent": "nepali.no-translation-editor",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    signal: AbortSignal.timeout(8_000),
  });

  if (!userResponse.ok) {
    throw new Error("GitHubIdentityLookupFailed");
  }

  const user = (await userResponse.json()) as GitHubUserResponse;

  if (!Number.isSafeInteger(user.id) || typeof user.login !== "string") {
    throw new Error("GitHubIdentityInvalid");
  }

  return {
    githubUserId: String(user.id),
    login: user.login,
  };
};
