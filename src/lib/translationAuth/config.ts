export class TranslationAuthConfigurationError extends Error {
  constructor() {
    super("Translation authentication is not configured.");
    this.name = "TranslationAuthConfigurationError";
  }
}

const requiredValue = (value: string | undefined) => {
  const normalized = value?.trim();

  if (!normalized) {
    throw new TranslationAuthConfigurationError();
  }

  return normalized;
};

export const getTranslationAuthConfig = () => ({
  clientId: requiredValue(import.meta.env.GITHUB_TRANSLATION_APP_CLIENT_ID),
  clientSecret: requiredValue(import.meta.env.GITHUB_TRANSLATION_APP_CLIENT_SECRET),
  allowedGitHubUserId: requiredValue(
    import.meta.env.TRANSLATION_ALLOWED_GITHUB_USER_ID,
  ),
  sessionSecret: requiredValue(import.meta.env.TRANSLATION_SESSION_SECRET),
});
