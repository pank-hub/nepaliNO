import { isSafeLinkHref } from "../informationBox/normalize.ts";

export const AI_PAGE_KEYS = ["aiInformation", "aiGuidelines"] as const;
export type AiPageKey = (typeof AI_PAGE_KEYS)[number];

// English is intentionally absent: its public route is not active yet.
export const AI_PAGE_LANGUAGES = ["ne", "nb"] as const;
export type AiPageLanguage = (typeof AI_PAGE_LANGUAGES)[number];

// Route segments follow the existing /{lang}/{segment}/ static-page convention.
export const AI_PAGE_ROUTES: Record<AiPageKey, string> = {
  aiInformation: "ai-information",
  aiGuidelines: "ai-guidelines",
};

// Editors choose a target; the public path is always resolved here.
export const AI_INTERNAL_LINK_TARGETS: Record<string, string> = {
  ...AI_PAGE_ROUTES,
  about: "about",
  transparency: "transparency",
  privacy: "privacy",
  contact: "contact",
};

export const isAiPageKey = (value: unknown): value is AiPageKey =>
  AI_PAGE_KEYS.includes(value as AiPageKey);

export const isAiPageLanguage = (value: unknown): value is AiPageLanguage =>
  AI_PAGE_LANGUAGES.includes(value as AiPageLanguage);

export const buildAiPagePath = (
  key: unknown,
  language: unknown,
): string | undefined =>
  isAiPageKey(key) && isAiPageLanguage(language)
    ? `/${language}/${AI_PAGE_ROUTES[key]}/`
    : undefined;

// Document IDs are stable so the seed import can never create duplicates.
export const buildAiPageDocumentId = (
  key: AiPageKey,
  language: AiPageLanguage,
) => `ai-transparency-page-${AI_PAGE_ROUTES[key]}-${language}`;

export const resolveAiInformationLink = ({
  enabled,
  language,
  available,
}: {
  enabled: unknown;
  language: unknown;
  available: unknown;
}): { href: string } | null => {
  if (enabled !== true || available !== true) return null;
  const href = buildAiPagePath("aiInformation", language);
  return href ? { href } : null;
};

export const resolveAiAlternatePath = ({
  key,
  language,
  alternateAvailable,
}: {
  key: AiPageKey;
  language: AiPageLanguage;
  alternateAvailable: boolean;
}): string => {
  const alternate: AiPageLanguage = language === "ne" ? "nb" : "ne";
  return (
    (alternateAvailable ? buildAiPagePath(key, alternate) : undefined) ??
    `/${alternate}/transparency/`
  );
};

type Block = Record<string, unknown>;

const ALLOWED_STYLES = ["normal", "h2", "h3", "blockquote"];
const ALLOWED_DECORATORS = ["strong", "em"];

const isRecord = (value: unknown): value is Block =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const resolveInternalHref = (
  target: unknown,
  language: AiPageLanguage,
  availablePages: ReadonlySet<string>,
): string | undefined => {
  if (typeof target !== "string") return undefined;
  if (!Object.hasOwn(AI_INTERNAL_LINK_TARGETS, target)) return undefined;
  // AI pages only link when the target document is published.
  if (isAiPageKey(target) && !availablePages.has(target)) return undefined;
  return `/${language}/${AI_INTERNAL_LINK_TARGETS[target]}/`;
};

const sanitizeBlock = (
  value: unknown,
  language: AiPageLanguage,
  availablePages: ReadonlySet<string>,
): Block | undefined => {
  if (
    !isRecord(value) ||
    value._type !== "block" ||
    !Array.isArray(value.children)
  ) {
    return undefined;
  }

  const style = value.style ?? "normal";
  if (typeof style !== "string" || !ALLOWED_STYLES.includes(style)) {
    return undefined;
  }
  if (
    value.listItem != null &&
    value.listItem !== "bullet" &&
    value.listItem !== "number"
  ) {
    return undefined;
  }

  // Internal targets become ordinary relative links.
  const safeLinks = new Map<string, Block>();
  const markDefs = Array.isArray(value.markDefs)
    ? value.markDefs.filter(isRecord)
    : [];
  for (const definition of markDefs) {
    if (typeof definition._key !== "string" || !definition._key) continue;
    if (definition._type === "link" && isSafeLinkHref(definition.href)) {
      safeLinks.set(definition._key, {
        _key: definition._key,
        _type: "link",
        href: definition.href.trim(),
      });
    } else if (definition._type === "internalPageLink") {
      const href = resolveInternalHref(
        definition.pageKey,
        language,
        availablePages,
      );
      if (href) {
        safeLinks.set(definition._key, {
          _key: definition._key,
          _type: "link",
          href,
        });
      }
    }
  }

  const children = value.children.flatMap((child): Block[] => {
    if (
      !isRecord(child) ||
      child._type !== "span" ||
      typeof child.text !== "string"
    ) {
      return [];
    }
    const marks = Array.isArray(child.marks)
      ? child.marks.filter(
          (mark): mark is string =>
            typeof mark === "string" &&
            (ALLOWED_DECORATORS.includes(mark) || safeLinks.has(mark)),
        )
      : [];
    return [
      {
        _type: "span",
        _key: typeof child._key === "string" ? child._key : undefined,
        text: child.text,
        marks,
      },
    ];
  });

  if (!children.some((child) => String(child.text).trim())) return undefined;

  const usedKeys = new Set(
    children.flatMap((child) => child.marks as string[]),
  );
  return {
    _type: "block",
    _key: typeof value._key === "string" ? value._key : undefined,
    style,
    ...(value.listItem
      ? { listItem: value.listItem, level: value.level === 2 ? 2 : 1 }
      : {}),
    children,
    markDefs: [...safeLinks.values()].filter((definition) =>
      usedKeys.has(definition._key as string),
    ),
  };
};

export interface AiTransparencyPageInput {
  _id?: unknown;
  pageKey?: unknown;
  language?: unknown;
  title?: unknown;
  summary?: unknown;
  body?: unknown;
  seoTitle?: unknown;
  seoDescription?: unknown;
  lastReviewedAt?: unknown;
}

export interface NormalizedAiTransparencyPage {
  pageKey: AiPageKey;
  language: AiPageLanguage;
  title: string;
  summary: string;
  body: Block[];
  seoTitle: string;
  seoDescription: string;
  lastReviewedAt?: string;
}

const trimmed = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

// Returns null for anything that must not render publicly.
export const normalizeAiTransparencyPage = (
  input: AiTransparencyPageInput | null | undefined,
  options: {
    language: AiPageLanguage;
    key: AiPageKey;
    availablePages?: Iterable<string>;
  },
): NormalizedAiTransparencyPage | null => {
  if (!isRecord(input)) return null;
  if (input.pageKey !== options.key || input.language !== options.language) {
    return null;
  }

  const title = trimmed(input.title);
  if (!title || !Array.isArray(input.body)) return null;

  const availablePages = new Set(options.availablePages ?? []);
  const body = input.body.flatMap((block) => {
    const sanitized = sanitizeBlock(block, options.language, availablePages);
    return sanitized ? [sanitized] : [];
  });
  if (body.length === 0) return null;

  const summary = trimmed(input.summary);
  const lastReviewedAt = trimmed(input.lastReviewedAt);

  return {
    pageKey: options.key,
    language: options.language,
    title,
    summary,
    body,
    seoTitle: trimmed(input.seoTitle) || title,
    seoDescription: trimmed(input.seoDescription) || summary,
    ...(/^\d{4}-\d{2}-\d{2}$/.test(lastReviewedAt) ? { lastReviewedAt } : {}),
  };
};
