export class TranslationGitHubConfigurationError extends Error {
  constructor() {
    super("Translation GitHub integration is not configured.");
    this.name = "TranslationGitHubConfigurationError";
  }
}

const requiredValue = (value: string | undefined) => {
  const normalized = value?.trim();

  if (!normalized) {
    throw new TranslationGitHubConfigurationError();
  }

  return normalized;
};

export const TRANSLATION_REPOSITORY_OWNER = "pank-hub";
export const TRANSLATION_REPOSITORY_NAME = "nepaliNO";
export const TRANSLATION_BASE_BRANCH = "main";
export const TRANSLATION_BRANCH_PREFIX = "translation/";

export const getTranslationGitHubConfig = () => ({
  appId: requiredValue(import.meta.env.GITHUB_TRANSLATION_APP_ID),
  installationId: requiredValue(
    import.meta.env.GITHUB_TRANSLATION_APP_INSTALLATION_ID,
  ),
  privateKey: requiredValue(
    import.meta.env.GITHUB_TRANSLATION_APP_PRIVATE_KEY,
  ).replaceAll("\\n", "\n"),
});
