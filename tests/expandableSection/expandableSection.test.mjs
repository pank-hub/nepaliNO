import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { getTranslationModule } from "../../src/lib/translationBrowser/registry.ts";
import {
  EXPANDABLE_SECTION_PREVIEW_LINES,
  EXPANDABLE_SECTION_PREVIEW_SIZES,
  normalizeExpandableSection,
} from "../../src/lib/expandableSection/normalize.ts";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

const paragraph = (text, extra = {}) => ({
  _type: "block",
  _key: `block-${text}`,
  style: "normal",
  children: [{ _type: "span", _key: "span-1", text, marks: [] }],
  markDefs: [],
  ...extra,
});

const section = (body, overrides = {}) => ({
  _type: "expandableSection",
  _key: "expandable-1",
  title: "  More information  ",
  previewSize: "standard",
  body,
  ...overrides,
});

test("validates the object and requires a trimmed title and meaningful body", () => {
  assert.equal(normalizeExpandableSection(null), null);
  assert.equal(normalizeExpandableSection({ _type: "informationBox" }), null);
  assert.equal(
    normalizeExpandableSection(section([paragraph("x")], { title: "   " })),
    null,
  );
  assert.equal(normalizeExpandableSection(section([])), null);
  assert.equal(normalizeExpandableSection(section([paragraph("   ")])), null);
  assert.equal(normalizeExpandableSection(section([{ _type: "image" }])), null);
  assert.equal(
    normalizeExpandableSection(section([paragraph("x")])).title,
    "More information",
  );
});

test("extracts paragraph text in reading order without repeating duplicate blocks", () => {
  const body = [
    paragraph("First paragraph ", {
      children: [
        { _type: "span", text: "First ", marks: ["strong"] },
        { _type: "span", text: "paragraph", marks: ["em"] },
      ],
    }),
    paragraph("Second paragraph."),
    paragraph("Second   paragraph!"),
    paragraph("Third paragraph."),
  ];
  const original = structuredClone(body);
  const result = normalizeExpandableSection(section(body));

  assert.equal(
    result.previewText,
    "First paragraph\nSecond paragraph.\nThird paragraph.",
  );
  assert.deepEqual(result.body, original);
  assert.deepEqual(body, original);
});

test("converts bullet, numbered, and nested list items to readable plain text", () => {
  const result = normalizeExpandableSection(
    section([
      paragraph("Before list."),
      paragraph("First bullet", { listItem: "bullet", level: 1 }),
      paragraph("Nested bullet", { listItem: "bullet", level: 2 }),
      paragraph("Another bullet", { listItem: "bullet", level: 1 }),
      paragraph("First numbered", { listItem: "number", level: 1 }),
      paragraph("Second numbered", { listItem: "number", level: 1 }),
      paragraph("After list."),
    ]),
  );

  assert.equal(
    result.previewText,
    [
      "Before list.",
      "• First bullet",
      "  • Nested bullet",
      "• Another bullet",
      "1. First numbered",
      "2. Second numbered",
      "After list.",
    ].join("\n"),
  );
  assert.doesNotMatch(result.previewText, /<[^>]+>/);
});

test("retains safe linked text without exposing its destination or link behavior", () => {
  const result = normalizeExpandableSection(
    section([
      paragraph("Read ", {
        markDefs: [
          { _key: "safe", _type: "link", href: "https://example.com/guide" },
          { _key: "unsafe", _type: "link", href: "javascript:alert(1)" },
        ],
        children: [
          { _type: "span", text: "Read ", marks: ["strong"] },
          { _type: "span", text: "the safe guide", marks: ["safe"] },
          { _type: "span", text: " and unsafe label", marks: ["unsafe"] },
        ],
      }),
    ]),
  );

  assert.equal(result.previewText, "Read the safe guide and unsafe label");
  assert.equal(result.previewText.includes("example.com"), false);
  assert.equal(result.previewText.includes("javascript:"), false);
  assert.equal(result.body[0].markDefs.length, 1);
  assert.equal(result.body[0].markDefs[0].href, "https://example.com/guide");
});

test("normalizes whitespace and skips malformed and unsupported content", () => {
  const result = normalizeExpandableSection(
    section([
      { _type: "editorialChart", title: "Not Portable Text" },
      paragraph("  Several\twords\nwith   spacing.  "),
      paragraph(" \n\t ", {
        children: [{ _type: "image", text: "unsupported child", marks: [] }],
      }),
      { _type: "block", children: "malformed" },
      paragraph("Later valid paragraph."),
    ]),
  );

  assert.equal(
    result.previewText,
    "Several words with spacing.\nLater valid paragraph.",
  );
  assert.equal(result.body.length, 2);
});

test("maps Compact, Standard, and Extended to predictable line targets", () => {
  assert.deepEqual(EXPANDABLE_SECTION_PREVIEW_SIZES, [
    "compact",
    "standard",
    "extended",
  ]);
  assert.deepEqual(EXPANDABLE_SECTION_PREVIEW_LINES, {
    compact: 4,
    standard: 6,
    extended: 9,
  });

  for (const [previewSize, previewLines] of Object.entries(
    EXPANDABLE_SECTION_PREVIEW_LINES,
  )) {
    const result = normalizeExpandableSection(
      section([paragraph("A long enough body.")], { previewSize }),
    );
    assert.equal(result.previewSize, previewSize);
    assert.equal(result.previewLines, previewLines);
  }
});

test("falls back to Standard for an invalid preview size and creates unique fallback ids", () => {
  const result = normalizeExpandableSection(
    section([paragraph("A valid single paragraph.")], {
      previewSize: "unexpected",
      _key: "",
    }),
    4,
  );

  assert.equal(result.previewSize, "standard");
  assert.equal(result.previewLines, 6);
  assert.equal(result.idSuffix, "i4");
});

test("keeps all complete canonical blocks for the expanded state", () => {
  const body = [
    paragraph("Opening paragraph."),
    paragraph("First list item", { listItem: "bullet", level: 1 }),
    paragraph("Nested list item", { listItem: "bullet", level: 2 }),
    paragraph("Closing paragraph."),
  ];
  const result = normalizeExpandableSection(section(body));

  assert.equal(result.body.length, 4);
  assert.deepEqual(
    result.body.map((block) => block.children[0].text),
    body.map((block) => block.children[0].text),
  );
  assert.equal("visibleBlocks" in result, false);
  assert.equal("hiddenBlocks" in result, false);
});

test("uses existing localized common labels in the Translation Editor registry", async () => {
  for (const language of ["ne", "nb"]) {
    const entries = new Map(
      getTranslationModule(language, "footer-common").entries.map(
        ({ key, value }) => [key, value],
      ),
    );
    assert.ok(entries.has("common.showMore"));
    assert.ok(entries.has("common.showLess"));
  }

  const { ne } = await import("../../src/i18n/ne.ts");
  const { nb } = await import("../../src/i18n/nb.ts");
  const { en } = await import("../../src/i18n/en.ts");
  assert.deepEqual(
    [ne.common.showMore, ne.common.showLess],
    ["थप हेर्नुहोस्", "कम देखाउनुहोस्"],
  );
  assert.deepEqual(
    [nb.common.showMore, nb.common.showLess],
    ["Vis mer", "Vis mindre"],
  );
  assert.deepEqual(
    [en.common.showMore, en.common.showLess],
    ["Show more", "Show less"],
  );
});

test("keeps the shared block, safe links, and renderer registered in News and Guides", async () => {
  const schemaIndex = await read("../../sanity/schemaTypes/index.ts");
  const schema = await read("../../sanity/schemaTypes/expandableSection.ts");
  assert.match(schemaIndex, /expandableSection,/);
  assert.match(schema, /initialValue: 'standard'/);
  assert.match(
    schema,
    /rule\.uri\(\{scheme: \['http', 'https'\], allowRelative: true\}\)/,
  );
  assert.match(schema, /meaningful text/);
  assert.doesNotMatch(
    schema,
    /requiredGroups|countContentGroups|previewBlockCount/,
  );
  assert.match(schema, /approximately 4 lines/);
  assert.match(schema, /approximately 6 lines/);
  assert.match(schema, /approximately 9 lines/);
  assert.match(schema, /final two lines fade/);
  assert.match(schema, /complete formatted content/);
  assert.doesNotMatch(
    schema,
    /opening paragraphs or complete lists become the collapsed preview/i,
  );
  assert.doesNotMatch(
    schema,
    /type: 'image'|type: 'editorialChart'|readAlsoBlockMember/,
  );

  for (const file of ["newsArticle", "publicInformationGuide"]) {
    assert.match(
      await read(`../../sanity/schemaTypes/${file}.ts`),
      /expandableSectionBlockMember,/,
    );
  }
  for (const file of ["news", "info"]) {
    const page = await read(`../../src/pages/[lang]/${file}/[slug].astro`);
    assert.match(page, /expandableSection: language === 'ne'/);
    assert.match(page, /_type: 'expandableSection'/);
  }
});

test("renders a plain-text preview, complete canonical body, and scoped progressive fade", async () => {
  const component = await read(
    "../../src/components/content/ExpandableSection.astro",
  );
  assert.match(component, /data-expandable-preview/);
  assert.match(component, /section\.previewText/);
  assert.match(component, /aria-hidden="true"/);
  assert.match(component, /data-expandable-content/);
  assert.match(component, /section\.body as any/);
  assert.match(component, /data-preview-size=\{section\.previewSize\}/);
  assert.match(component, /--preview-lines: 4/);
  assert.match(component, /--preview-lines: 6/);
  assert.match(component, /--preview-lines: 9/);
  assert.match(component, /--preview-fade-start/);
  assert.match(component, /mask-image: linear-gradient/);
  assert.match(component, /-webkit-mask-image: linear-gradient/);
  assert.match(component, /color-mix\(in srgb, var\(--text\)/);
  assert.match(component, /var\(--surface-muted\)/);
  assert.doesNotMatch(component, /filter:\s*blur|#[\da-f]{3,8}\b/i);
  assert.doesNotMatch(component, /continuation/);
  assert.match(component, /border: 0;/);
  assert.match(component, /min-height: 2\.75rem/);
  assert.match(component, /data-preparing/);
  assert.match(component, /expandableSection\/enhance\.ts/);

  const enhancement = await read("../../src/lib/expandableSection/enhance.ts");
  assert.match(enhancement, /const lineHeight = getLineHeight\(root\)/);
  assert.match(enhancement, /contentHeight <= previewHeight/);
  assert.match(enhancement, /button\.remove\(\)/);
  assert.match(enhancement, /region\.inert = true/);
  assert.match(enhancement, /preview\.removeAttribute\("aria-hidden"\)/);
  assert.match(enhancement, /preview\.setAttribute\("aria-hidden", "true"\)/);
  assert.match(enhancement, /region\.scrollHeight/);
  assert.match(enhancement, /reduceMotion\.matches/);
  assert.match(enhancement, /new ResizeObserver/);
  assert.match(enhancement, /transitionend/);
  assert.equal(
    (enhancement.match(/button\.addEventListener\(["']click["']/g) ?? [])
      .length,
    1,
  );
});

test("scopes compact canonical typography to mobile without changing preview or desktop rules", async () => {
  const component = await read(
    "../../src/components/content/ExpandableSection.astro",
  );
  const mobileRules = component.match(
    /@media \(max-width: 39\.999rem\) \{([\s\S]*?)\n  \}/,
  )?.[1];

  assert.ok(mobileRules);
  assert.match(
    mobileRules,
    /\.expandable-section:is\(\s*:not\(\[data-enhanced\]\),\s*\[data-expanded\],\s*\[data-transitioning\]\s*\)\s*\.expandable-section__body\s*\{[^}]*font-size:\s*1\.0625rem;[^}]*line-height:\s*1\.75;/,
  );
  assert.match(
    mobileRules,
    /\.expandable-section:is\(\s*:not\(\[data-enhanced\]\),\s*\[data-expanded\],\s*\[data-transitioning\]\s*\)\s*\.expandable-section__body\s+:global\(li\)\s*\{\s*margin-block:\s*0\.2rem;/,
  );
  assert.match(mobileRules, /margin-block-start:\s*0\.5em;/);
  assert.match(component, /@media \(min-width: 40rem\)/);
  assert.match(component, /--preview-lines: 4/);
  assert.match(component, /--preview-fade-start: 50%/);
});
