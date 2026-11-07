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
  readonly DISCOURSE_FORUM_PUBLISHER_API_KEY?: string;
  readonly DISCOURSE_FORUM_PUBLISHER_API_USERNAME?: string;
  readonly SANITY_FORUM_WEBHOOK_SECRET?: string;
  readonly SANITY_FORUM_AUTOMATION_TOKEN?: string;
  // Draft preview (server-only; never PUBLIC_*). See DEVELOPER_HANDOVER.md, "Draft preview".
  readonly SANITY_API_READ_TOKEN?: string;
  readonly PREVIEW_COOKIE_SECRET?: string;
  // Development only (astro dev): extra approved Studio origin, e.g. a Codespaces forwarded URL. Ignored in production.
  readonly PREVIEW_DEV_STUDIO_ORIGIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
