import { isSafeLinkHref } from "../informationBox/normalize.ts";

export const EXPANDABLE_SECTION_PREVIEW_SIZES = [
  "compact",
  "standard",
  "extended",
] as const;

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
  visibleBlocks: Block[];
  hiddenBlocks: Block[];
  continuationText: string | null;
  idSuffix: string;
}

const isRecord = (value: unknown): value is Block =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const previewBlocks: Record<ExpandableSectionPreviewSize, number> = {
  compact: 1,
  standard: 2,
  extended: 3,
};

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
    )
      return [];
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

  const listItem = value.listItem;
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
    ...(listItem ? { listItem, level } : {}),
    children,
    markDefs: safeLinks,
  };
};

const groupBlocks = (blocks: Array<Block | undefined>): Block[][] => {
  const groups: Block[][] = [];

  for (const block of blocks) {
    if (!block) {
      groups.push([]);
      continue;
    }

    const listItem = block.listItem;
    const previous = groups.at(-1)?.[0];
    if (
      (listItem === "bullet" || listItem === "number") &&
      previous?.listItem === listItem
    ) {
      // Level changes create nested items, not a safe place to split the list.
      groups[groups.length - 1].push(block);
    } else {
      groups.push([block]);
    }
  }

  return groups;
};

export const getContinuationText = (blocks: unknown): string | null => {
  const firstBlock = Array.isArray(blocks) ? blocks[0] : undefined;
  if (!isRecord(firstBlock) || !Array.isArray(firstBlock.children)) return null;

  const text = firstBlock.children
    .map((child) =>
      isRecord(child) &&
      child._type === "span" &&
      typeof child.text === "string"
        ? child.text
        : "",
    )
    .join("")
    .replace(/\s+/gu, " ")
    .trim();

  return text || null;
};

const getGroupText = (blocks: Block[]): string =>
  blocks
    .flatMap((block) =>
      Array.isArray(block.children)
        ? block.children.flatMap((child) =>
            isRecord(child) && typeof child.text === "string"
              ? [child.text]
              : [],
          )
        : [],
    )
    .join(" ")
    .replace(/\s+/gu, " ")
    .trim();

const normalizeComparableText = (text: string): string =>
  text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\p{P}\p{S}\p{White_Space}]+/gu, "");

const getCharacterBigrams = (text: string): Map<string, number> => {
  const characters = Array.from(text);
  const bigrams = new Map<string, number>();
  for (let index = 0; index < characters.length - 1; index += 1) {
    const bigram = `${characters[index]}${characters[index + 1]}`;
    bigrams.set(bigram, (bigrams.get(bigram) ?? 0) + 1);
  }
  return bigrams;
};

const isSubstantiallyDuplicate = (
  candidate: string,
  visible: string,
): boolean => {
  const normalizedCandidate = normalizeComparableText(candidate);
  const normalizedVisible = normalizeComparableText(visible);
  if (!normalizedCandidate || !normalizedVisible) return false;
  if (normalizedCandidate === normalizedVisible) return true;

  const longerLength = Math.max(
    Array.from(normalizedCandidate).length,
    Array.from(normalizedVisible).length,
  );
  const shorterLength = Math.min(
    Array.from(normalizedCandidate).length,
    Array.from(normalizedVisible).length,
  );
  if (longerLength < 24 || shorterLength / longerLength < 0.85) return false;

  const candidateBigrams = getCharacterBigrams(normalizedCandidate);
  const visibleBigrams = getCharacterBigrams(normalizedVisible);
  let sharedBigrams = 0;
  for (const [bigram, count] of candidateBigrams) {
    sharedBigrams += Math.min(count, visibleBigrams.get(bigram) ?? 0);
  }

  const totalBigrams =
    Array.from(candidateBigrams.values()).reduce(
      (sum, count) => sum + count,
      0,
    ) +
    Array.from(visibleBigrams.values()).reduce((sum, count) => sum + count, 0);
  return totalBigrams > 0 && (2 * sharedBigrams) / totalBigrams >= 0.9;
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

  const blocks = Array.isArray(input.body)
    ? input.body.map((block) => sanitizeBlock(block))
    : [];
  if (!blocks.some((block) => block)) return null;

  const previewSize = normalizePreviewSize(input.previewSize);
  const groups = groupBlocks(blocks).filter((group) => group.length > 0);
  const splitAt = Math.min(previewBlocks[previewSize], groups.length);
  const visibleGroups = groups.slice(0, splitAt);
  const hiddenGroups = groups.slice(splitAt);
  const hiddenBlocks = hiddenGroups.flat();
  const finalVisibleText = getGroupText(visibleGroups.at(-1) ?? []);
  const continuationText =
    hiddenGroups
      .map((group) => getContinuationText(group))
      .find(
        (text) => text && !isSubstantiallyDuplicate(text, finalVisibleText),
      ) ?? null;

  return {
    title,
    previewSize,
    visibleBlocks: visibleGroups.flat(),
    hiddenBlocks,
    continuationText,
    idSuffix: createIdSuffix(input, index),
  };
};
