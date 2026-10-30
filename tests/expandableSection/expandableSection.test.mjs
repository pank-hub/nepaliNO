import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { getTranslationModule } from "../../src/lib/translationBrowser/registry.ts";
import {
  EXPANDABLE_SECTION_PREVIEW_SIZES,
  getContinuationText,
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

test("validates the object and requires a trimmed non-empty title and body", () => {
  assert.equal(normalizeExpandableSection(null), null);
  assert.equal(normalizeExpandableSection({ _type: "informationBox" }), null);
  assert.equal(
    normalizeExpandableSection(section([paragraph("x")], { title: "   " })),
    null,
  );
  assert.equal(normalizeExpandableSection(section([])), null);
  assert.equal(normalizeExpandableSection(section([{ _type: "image" }])), null);
  assert.equal(
    normalizeExpandableSection(section([paragraph("x")])).title,
    "More information",
  );
});

test("normalizes preview size and splits complete paragraph blocks", () => {
  assert.deepEqual(EXPANDABLE_SECTION_PREVIEW_SIZES, [
    "compact",
    "standard",
    "extended",
  ]);
  const body = ["One", "Two", "Three", "Four"].map((text) => paragraph(text));
  const compact = normalizeExpandableSection(
    section(body, { previewSize: "compact" }),
  );
  const standard = normalizeExpandableSection(section(body));
  const extended = normalizeExpandableSection(
    section(body, { previewSize: "extended" }),
  );
  const fallback = normalizeExpandableSection(
    section(body, { previewSize: "unexpected" }),
  );

  assert.equal(compact.visibleBlocks.length, 1);
  assert.equal(compact.hiddenBlocks.length, 3);
  assert.equal(standard.visibleBlocks.length, 2);
  assert.equal(standard.hiddenBlocks.length, 2);
  assert.equal(extended.visibleBlocks.length, 3);
  assert.equal(extended.hiddenBlocks.length, 1);
  assert.equal(fallback.previewSize, "standard");
  assert.equal(
    normalizeExpandableSection(section(body.slice(0, 2))).hiddenBlocks.length,
    0,
  );
});

test("keeps consecutive logical lists together when splitting the preview", () => {
  const body = [
    paragraph("Introduction"),
    paragraph("Bullet one", { listItem: "bullet", level: 1 }),
    paragraph("Bullet two", { listItem: "bullet", level: 1 }),
    paragraph("Numbered one", { listItem: "number", level: 1 }),
    paragraph("Nested bullet", { listItem: "bullet", level: 2 }),
    paragraph("Closing"),
  ];
  const result = normalizeExpandableSection(section(body));

  assert.deepEqual(
    result.visibleBlocks.map((block) => block.children[0].text),
    ["Introduction", "Bullet one", "Bullet two"],
  );
  assert.deepEqual(
    result.hiddenBlocks.map((block) => block.children[0].text),
    ["Numbered one", "Nested bullet", "Closing"],
  );

  const nested = normalizeExpandableSection(
    section([
      paragraph("Introduction"),
      paragraph("Parent item", { listItem: "bullet", level: 1 }),
      paragraph("Nested item", { listItem: "bullet", level: 2 }),
      paragraph("Next section"),
    ]),
  );
  assert.deepEqual(
    nested.visibleBlocks.map((block) => block.children[0].text),
    ["Introduction", "Parent item", "Nested item"],
  );
  assert.deepEqual(
    nested.hiddenBlocks.map((block) => block.children[0].text),
    ["Next section"],
  );
});

test("derives plain continuation text from only the first hidden semantic group", () => {
  const linkedParagraph = paragraph("See this ", {
    markDefs: [
      { _key: "safe-link", _type: "link", href: "https://example.com/" },
    ],
    children: [
      { _type: "span", text: "Read ", marks: ["strong"] },
      { _type: "span", text: "the linked guide", marks: ["safe-link"] },
    ],
  });
  const nextParagraph = paragraph("This group must not appear in the preview.");
  const result = normalizeExpandableSection(
    section(
      [
        paragraph("Visible group one."),
        paragraph("Visible group two."),
        linkedParagraph,
        nextParagraph,
      ],
      { previewSize: "standard" },
    ),
  );

  assert.equal(result.continuationText, "Read the linked guide");
  assert.equal(result.hiddenBlocks.length, 2);
  assert.deepEqual(
    result.hiddenBlocks.map((block) =>
      block.children.map((child) => child.text),
    ),
    [
      ["Read ", "the linked guide"],
      ["This group must not appear in the preview."],
    ],
  );
  assert.equal(result.hiddenBlocks[0].markDefs[0].href, "https://example.com/");
  assert.equal(result.continuationText.includes("example.com"), false);
});

test("list continuation uses only the first hidden item, including nested lists", () => {
  const result = normalizeExpandableSection(
    section(
      [
        paragraph("Visible paragraph one."),
        paragraph("Visible paragraph two."),
        paragraph("First hidden item", {
          listItem: "bullet",
          level: 1,
          children: [
            { _type: "span", text: "First ", marks: ["strong"] },
            { _type: "span", text: "hidden item", marks: [] },
          ],
        }),
        paragraph("Nested item must not become a second preview element.", {
          listItem: "bullet",
          level: 2,
        }),
        paragraph("Next logical group."),
      ],
      { previewSize: "standard" },
    ),
  );

  assert.equal(result.continuationText, "First hidden item");
  assert.equal(result.hiddenBlocks.length, 3);
  assert.deepEqual(
    result.hiddenBlocks.map((block) => block.children[0].text),
    [
      "First ",
      "Nested item must not become a second preview element.",
      "Next logical group.",
    ],
  );
});

test("unsafe and malformed continuation data yields safe text or the cue fallback", () => {
  const unsafeLink = paragraph("Do not expose a link target.", {
    markDefs: [
      { _key: "unsafe-link", _type: "link", href: "javascript:alert(1)" },
    ],
    children: [
      { _type: "span", text: "Plain text ", marks: ["unsafe-link"] },
      { _type: "image", text: "unsupported child", marks: [] },
      { _type: "span", text: "remains.", marks: [] },
    ],
  });
  const result = normalizeExpandableSection(
    section([
      paragraph("Visible group one."),
      paragraph("Visible group two."),
      { _type: "image" },
      unsafeLink,
      paragraph("Later hidden group."),
    ]),
  );

  assert.equal(result.continuationText, "Plain text remains.");
  assert.deepEqual(result.hiddenBlocks[0].markDefs, []);
  assert.deepEqual(
    result.hiddenBlocks[0].children.map((child) => child.text),
    ["Plain text ", "remains."],
  );
  assert.equal(
    getContinuationText([
      {
        children: [
          { _type: "image", text: "not a span" },
          { _type: "span", text: "   " },
        ],
      },
    ]),
    null,
  );
  assert.equal(getContinuationText([]), null);
});

test("unsupported blocks interrupt otherwise compatible logical lists", () => {
  const result = normalizeExpandableSection(
    section([
      paragraph("Intro"),
      paragraph("First bullet", { listItem: "bullet", level: 1 }),
      { _type: "editorialChart" },
      paragraph("Second list", { listItem: "bullet", level: 1 }),
      paragraph("Closing"),
    ]),
  );

  assert.deepEqual(
    result.visibleBlocks.map((block) => block.children[0].text),
    ["Intro", "First bullet"],
  );
  assert.deepEqual(
    result.hiddenBlocks.map((block) => block.children[0].text),
    ["Second list", "Closing"],
  );
});

test("sanitizes unsupported nodes, marks, and unsafe links without splitting blocks", () => {
  const result = normalizeExpandableSection(
    section([
      paragraph("First"),
      paragraph("Unsafe link", {
        markDefs: [
          { _key: "bad", _type: "link", href: "javascript:alert(1)" },
          { _key: "good", _type: "link", href: "https://example.com" },
        ],
        children: [
          {
            _type: "span",
            text: "Unsafe",
            marks: ["bad", "unknown", "strong"],
          },
          { _type: "span", text: "Safe", marks: ["good", "em"] },
          { _type: "image", text: "not allowed", marks: [] },
        ],
      }),
      { _type: "editorialChart" },
      paragraph("Last", { style: "h2" }),
    ]),
  );

  assert.equal(result.visibleBlocks[1].children.length, 2);
  assert.deepEqual(result.visibleBlocks[1].children[0].marks, ["strong"]);
  assert.deepEqual(result.visibleBlocks[1].children[1].marks, ["good", "em"]);
  assert.deepEqual(result.visibleBlocks[1].markDefs, [
    { _key: "good", _type: "link", href: "https://example.com" },
  ]);
  assert.equal(result.hiddenBlocks.length, 1);
  assert.equal(result.hiddenBlocks[0].style, "normal");
});

test("uses the existing localized common labels in the Translation Editor registry", async () => {
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

test("registers the shared block, safe body schema, and renderer in News and Guides", async () => {
  const schemaIndex = await read("../../sanity/schemaTypes/index.ts");
  const schema = await read("../../sanity/schemaTypes/expandableSection.ts");
  assert.match(schemaIndex, /expandableSection,/);
  assert.match(schema, /initialValue: 'standard'/);
  assert.match(
    schema,
    /rule\.uri\(\{scheme: \['http', 'https'\], allowRelative: true\}\)/,
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

test("uses a full-block reveal with a JS-only control and no line-clamping", async () => {
  const component = await read(
    "../../src/components/content/ExpandableSection.astro",
  );
  assert.match(component, /aria-hidden/);
  assert.match(component, /data-preparing/);
  assert.match(component, /expandable-section__continuation/);
  assert.match(component, /aria-hidden="true"/);
  assert.match(component, /section\.continuationText/);
  assert.match(component, /expandable-section__continuation-text/);
  assert.doesNotMatch(
    component.match(
      /<div[\s\S]*?expandable-section__continuation[\s\S]*?<\/div>/,
    )?.[0] ?? "",
    /<a\b|<button\b|\bid=/,
  );
  assert.match(component, /mask-image: linear-gradient/);
  assert.match(component, /-webkit-mask-image: linear-gradient/);
  assert.match(
    component,
    /background: linear-gradient\([\s\S]*?var\(--surface-muted\)/,
  );
  assert.match(
    component,
    /\.expandable-section\[data-enhanced\] \.expandable-section__toggle:hover/,
  );
  assert.ok(
    component.indexOf("data-preparing") <
      component.indexOf("data-expandable-content"),
  );
  assert.match(component, /expandableSection\/enhance\.ts/);
  assert.doesNotMatch(component, /line-clamp|webkit-line-clamp|clip-path/);
  assert.doesNotMatch(component, /#[\da-f]{3,8}\b/i);

  const enhancement = await read("../../src/lib/expandableSection/enhance.ts");
  assert.match(
    component,
    /\.expandable-section__continuation,\s*\.expandable-section__toggle\s*\{\s*display:\s*none/s,
  );
  assert.match(
    component,
    /\.expandable-section\[data-enhanced\] \.expandable-section__continuation\s*\{[\s\S]*?display:\s*block/,
  );
  assert.match(
    component,
    /\.expandable-section\[data-expanded\] \.expandable-section__continuation/,
  );
  assert.match(enhancement, /region\.inert = true/);
  assert.match(enhancement, /region\.scrollHeight/);
  assert.match(
    enhancement,
    /region\.style\.height = `\$\{region\.scrollHeight\}px`/,
  );
  assert.equal(
    (enhancement.match(/button\.addEventListener\(["']click["']/g) ?? [])
      .length,
    1,
  );
});
