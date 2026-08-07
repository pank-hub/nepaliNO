import { directorySubmissionNB } from "../../i18n/directorySubmission.nb";
import { directorySubmissionNe } from "../../i18n/directorySubmission.ne";
import { eventSubmissionNB } from "../../i18n/eventSubmission.nb";
import { eventSubmissionNe } from "../../i18n/eventSubmission.ne";
import { nb } from "../../i18n/nb";
import { ne } from "../../i18n/ne";

export const translationLanguages = ["ne", "nb"] as const;
export type TranslationLanguage = (typeof translationLanguages)[number];

export const translationModuleIds = [
  "navigation",
  "homepage",
  "news",
  "events",
  "directory",
  "information",
  "footer-common",
  "event-submission",
  "directory-submission",
] as const;

export type TranslationModuleId = (typeof translationModuleIds)[number];

export type TranslationEntry = {
  key: string;
  value: string;
};

export type TranslationModule = {
  id: TranslationModuleId;
  title: string;
  description: string;
  entries: TranslationEntry[];
};

const languageLabels: Record<TranslationLanguage, string> = {
  ne: "Nepali",
  nb: "Norwegian",
};

const moduleMetadata: Record<
  TranslationModuleId,
  { title: string; description: string }
> = {
  navigation: {
    title: "Navigation",
    description: "Main public navigation labels and language name.",
  },
  homepage: {
    title: "Homepage",
    description: "Homepage metadata, introduction, actions and public content sections.",
  },
  news: {
    title: "News",
    description: "News archive, article and metadata wording. Technical count functions are excluded.",
  },
  events: {
    title: "Events",
    description: "Public Event archives, detail pages, status labels and registration wording.",
  },
  directory: {
    title: "Community Directory",
    description: "Public Directory archives, listing pages and verification wording.",
  },
  information: {
    title: "Public Information",
    description: "Knowledge-centre, Topic Hub and official-source guidance wording.",
  },
  "footer-common": {
    title: "Footer and common wording",
    description: "Footer, accessibility and reusable interface labels.",
  },
  "event-submission": {
    title: "Event submission form",
    description: "Public Event submission form wording, including ordered guidance lists.",
  },
  "directory-submission": {
    title: "Directory submission form",
    description: "Public Community Directory suggestion form wording.",
  },
};

const deferredHomepageKeys = new Set(["comingSoon"]);

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const flattenStrings = (
  value: unknown,
  prefix = "",
  excludedKeys: ReadonlySet<string> = new Set(),
): TranslationEntry[] => {
  if (typeof value === "string") {
    return [{ key: prefix, value }];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      flattenStrings(item, `${prefix}[${index}]`, excludedKeys),
    );
  }

  if (!isPlainObject(value)) {
    return [];
  }

  return Object.entries(value).flatMap(([key, item]) => {
    if (excludedKeys.has(key)) {
      return [];
    }

    const path = prefix ? `${prefix}.${key}` : key;
    return flattenStrings(item, path, excludedKeys);
  });
};

const mainTranslations = { ne, nb } as const;
const eventSubmissionTranslations = {
  ne: eventSubmissionNe,
  nb: eventSubmissionNB,
} as const;
const directorySubmissionTranslations = {
  ne: directorySubmissionNe,
  nb: directorySubmissionNB,
} as const;

const getModuleSource = (
  language: TranslationLanguage,
  moduleId: TranslationModuleId,
): { value: unknown; prefix?: string; excludedKeys?: ReadonlySet<string> } => {
  const translations = mainTranslations[language];

  switch (moduleId) {
    case "navigation":
      return {
        value: {
          languageName: translations.languageName,
          navigation: translations.navigation,
        },
      };
    case "homepage":
      return {
        value: translations.home,
        prefix: "home",
        excludedKeys: deferredHomepageKeys,
      };
    case "news":
      return { value: translations.news, prefix: "news" };
    case "events": {
      const { submission: _submission, ...events } = translations.events;
      return { value: events, prefix: "events" };
    }
    case "directory": {
      const { submission: _submission, ...directory } = translations.directory;
      return { value: directory, prefix: "directory" };
    }
    case "information":
      return { value: translations.information, prefix: "information" };
    case "footer-common":
      return {
        value: {
          footer: translations.footer,
          common: translations.common,
        },
      };
    case "event-submission":
      return {
        value: eventSubmissionTranslations[language],
        prefix: "events.submission",
      };
    case "directory-submission":
      return {
        value: directorySubmissionTranslations[language],
        prefix: "directory.submission",
      };
  }
};

export const isTranslationLanguage = (
  value: string | undefined,
): value is TranslationLanguage =>
  translationLanguages.includes(value as TranslationLanguage);

export const isTranslationModuleId = (
  value: string | undefined,
): value is TranslationModuleId =>
  translationModuleIds.includes(value as TranslationModuleId);

export const getTranslationLanguageLabel = (language: TranslationLanguage) =>
  languageLabels[language];

export const getTranslationModule = (
  language: TranslationLanguage,
  moduleId: TranslationModuleId,
): TranslationModule => {
  const source = getModuleSource(language, moduleId);
  const metadata = moduleMetadata[moduleId];

  return {
    id: moduleId,
    ...metadata,
    entries: flattenStrings(
      source.value,
      source.prefix,
      source.excludedKeys,
    ),
  };
};

export const getTranslationModuleSummaries = (
  language: TranslationLanguage,
) =>
  translationModuleIds.map((moduleId) => {
    const module = getTranslationModule(language, moduleId);
    return {
      id: module.id,
      title: module.title,
      description: module.description,
      count: module.entries.length,
    };
  });
