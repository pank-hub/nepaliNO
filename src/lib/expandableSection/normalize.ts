import { isSafeLinkHref } from "../informationBox/normalize.ts";

export const EXPANDABLE_SECTION_PREVIEW_SIZES = [
  "compact",
  "standard",
  "extended",
] as const;

export const EXPANDABLE_SECTION_PREVIEW_LINES = {
  compact: 4,
  standard: 6,
  extended: 9,
} as const;

export type ExpandableSectionPreviewSize =
  (typeof EXPANDABLE_SECTION_PREVIEW_SIZES)[number];

export interface ExpandableSectionInput {
  _type?: unknown;
  _key?: unknown;
  title?: unknown;
  previewSize?: unknown;
  body?: unknown;
}

type Block = Record<string, unknown>;

export interface NormalizedExpandableSection {
  title: string;
  previewSize: ExpandableSectionPreviewSize;
  previewLines: number;
  previewText: string;
  body: Block[];
  idSuffix: string;
}

const isRecord = (value: unknown): value is Block =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const sanitizeBlock = (value: unknown): Block | undefined => {
  if (
    !isRecord(value) ||
    value._type !== "block" ||
    !Array.isArray(value.children)
  ) {
    return undefined;
  }

  if (
    value.listItem !== undefined &&
    value.listItem !== "bullet" &&
    value.listItem !== "number"
  ) {
    return undefined;
  }

  const markDefs = Array.isArray(value.markDefs)
    ? value.markDefs.filter(isRecord)
    : [];
  const safeLinks = markDefs.flatMap((definition) => {
    if (
      definition._type !== "link" ||
      typeof definition._key !== "string" ||
      !definition._key ||
      !isSafeLinkHref(definition.href)
    ) {
      return [];
    }
    return [
      {
        _key: definition._key,
        _type: "link",
        href: definition.href.trim(),
      },
    ];
  });
  const safeLinkKeys = new Set(safeLinks.map((definition) => definition._key));
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
            (mark === "strong" || mark === "em" || safeLinkKeys.has(mark)),
        )
      : [];
    return [
      {
        _type: "span",
        ...(typeof child._key === "string" ? { _key: child._key } : {}),
        text: child.text,
        marks,
      },
    ];
  });

  if (
    !children.some(
      (child) => typeof child.text === "string" && child.text.trim(),
    )
  ) {
    return undefined;
  }

  const level =
    Number.isInteger(value.level) &&
    typeof value.level === "number" &&
    value.level > 0
      ? value.level
      : 1;

  return {
    _type: "block",
    ...(typeof value._key === "string" ? { _key: value._key } : {}),
    style: "normal",
    ...(value.listItem ? { listItem: value.listItem, level } : {}),
    children,
    markDefs: safeLinks,
  };
};

const getBlockText = (block: Block): string => {
  if (!Array.isArray(block.children)) return "";

  return block.children
    .flatMap((child) =>
      isRecord(child) &&
      child._type === "span" &&
      typeof child.text === "string"
        ? [child.text]
        : [],
    )
    .join("")
    .replace(/\s+/gu, " ")
    .trim();
};

const normalizeComparableText = (text: string): string =>
  text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\p{P}\p{S}\p{White_Space}]+/gu, "");

const formatPreviewText = (blocks: Block[]): string => {
  const lines: string[] = [];
  const seen = new Set<string>();
  const numberedItems = new Map<number, number>();
  let previousWasList = false;

  for (const block of blocks) {
    const text = getBlockText(block);
    const comparableText = normalizeComparableText(text);
    if (
      !text ||
      !comparableText ||
      seen.has(comparableText) ||
      (comparableText.length >= 12 &&
        lines.some((line) =>
          normalizeComparableText(line).includes(comparableText),
        ))
    ) {
      continue;
    }
    seen.add(comparableText);

    const listItem = block.listItem;
    if (listItem === "bullet" || listItem === "number") {
      const level =
        typeof block.level === "number" && block.level > 0 ? block.level : 1;
      const indent = "  ".repeat(Math.min(level - 1, 4));
      let marker = "•";
      if (listItem === "number") {
        const number = (numberedItems.get(level) ?? 0) + 1;
        numberedItems.set(level, number);
        marker = `${number}.`;
      }
      for (const nestedLevel of numberedItems.keys()) {
        if (nestedLevel > level) numberedItems.delete(nestedLevel);
      }
      lines.push(`${indent}${marker} ${text}`);
      previousWasList = true;
      continue;
    }

    if (previousWasList) numberedItems.clear();
    lines.push(text);
    previousWasList = false;
  }

  return lines.join("\n").trim();
};

const normalizePreviewSize = (value: unknown): ExpandableSectionPreviewSize =>
  EXPANDABLE_SECTION_PREVIEW_SIZES.includes(
    value as ExpandableSectionPreviewSize,
  )
    ? (value as ExpandableSectionPreviewSize)
    : "standard";

const createIdSuffix = (input: unknown, index: number): string => {
  const key =
    isRecord(input) && typeof input._key === "string" ? input._key : "";
  return key.replace(/[^a-zA-Z0-9_-]/g, "") || `i${index}`;
};

export const normalizeExpandableSection = (
  input: unknown,
  index = 0,
): NormalizedExpandableSection | null => {
  if (!isRecord(input) || input._type !== "expandableSection") return null;

  const title = typeof input.title === "string" ? input.title.trim() : "";
  if (!title || title.length > 160) return null;

  const body = Array.isArray(input.body)
    ? input.body.flatMap((block) => {
        const sanitized = sanitizeBlock(block);
        return sanitized ? [sanitized] : [];
      })
    : [];
  const previewText = formatPreviewText(body);
  if (!body.length || !previewText) return null;

  const previewSize = normalizePreviewSize(input.previewSize);

  return {
    title,
    previewSize,
    previewLines: EXPANDABLE_SECTION_PREVIEW_LINES[previewSize],
    previewText,
    body,
    idSuffix: createIdSuffix(input, index),
  };
};
