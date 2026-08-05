/// <reference types="astro/client" />
/// <reference types="@sanity/astro/module" />

interface ImportMetaEnv {
  readonly GITHUB_TRANSLATION_APP_CLIENT_ID?: string;
  readonly GITHUB_TRANSLATION_APP_CLIENT_SECRET?: string;
  readonly GITHUB_TRANSLATION_APP_ID?: string;
  readonly GITHUB_TRANSLATION_APP_INSTALLATION_ID?: string;
  readonly GITHUB_TRANSLATION_APP_PRIVATE_KEY?: string;
  readonly TRANSLATION_ALLOWED_GITHUB_USER_ID?: string;
  readonly TRANSLATION_SESSION_SECRET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
