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

  return {
    title,
    previewSize,
    visibleBlocks: visibleGroups.flat(),
    hiddenBlocks,
    continuationText: getContinuationText(hiddenGroups[0] ?? []),
    idSuffix: createIdSuffix(input, index),
  };
};
