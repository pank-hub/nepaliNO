import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  articleSummaryIds,
  normalizeArticleSummary,
} from "../../src/lib/articleSummary/normalize.ts";
import {
  validateArticleSummaryItem,
  validateArticleSummaryItems,
} from "../../sanity/schemaTypes/articleSummaryValidation.ts";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const on = (items, extra = {}) => ({ enabled: true, items, ...extra });

test("schema is registered and added to News and Guides", async () => {
  const [index, schema, newsSchema, guideSchema] = await Promise.all([
    read("../../sanity/schemaTypes/index.ts"),
    read("../../sanity/schemaTypes/articleSummary.ts"),
    read("../../sanity/schemaTypes/newsArticle.ts"),
    read("../../sanity/schemaTypes/publicInformationGuide.ts"),
  ]);
  assert.match(index, /articleSummary/);
  assert.match(schema, /name: 'articleSummary'/);
  assert.match(schema, /name: 'enabled'[\s\S]*initialValue: false/);
  assert.match(schema, /of: \[\{type: 'string'/);
  assert.match(schema, /editor must check every point/);
  for (const s of [newsSchema, guideSchema]) {
    assert.match(s, /name: 'articleSummary'[\s\S]*type: 'articleSummary'/);
  }
  assert.doesNotMatch(schema, /name: '(title|button|disclosure|label)'/);
});

test("validators enforce count, blanks, length and duplicates only when enabled", () => {
  assert.equal(validateArticleSummaryItems(["a"], false), true);
  assert.equal(validateArticleSummaryItems(undefined, undefined), true);
  assert.notEqual(validateArticleSummaryItems(["a"], true), true);
  assert.notEqual(
    validateArticleSummaryItems(["a", "b", "c", "d", "e"], true),
    true,
  );
  assert.notEqual(validateArticleSummaryItems(["a", " "], true), true);
  assert.notEqual(validateArticleSummaryItems(["Same", " same "], true), true);
  assert.equal(validateArticleSummaryItems(["a", "b"], true), true);
  assert.equal(validateArticleSummaryItems(["a", "b", "c", "d"], true), true);
  assert.notEqual(validateArticleSummaryItem(""), true);
  assert.notEqual(validateArticleSummaryItem(" padded "), true);
  assert.notEqual(validateArticleSummaryItem("x".repeat(241)), true);
  assert.equal(validateArticleSummaryItem("ok"), true);
});

test("normalizer fails closed for absent, disabled and too-few items", () => {
  assert.equal(normalizeArticleSummary(undefined), null);
  assert.equal(normalizeArticleSummary(null), null);
  assert.equal(normalizeArticleSummary({ items: ["a", "b"] }), null);
  assert.equal(
    normalizeArticleSummary({ enabled: false, items: ["a", "b"] }),
    null,
  );
  assert.equal(
    normalizeArticleSummary({ enabled: "true", items: ["a", "b"] }),
    null,
  );
  assert.equal(normalizeArticleSummary(on(["only one"])), null);
  assert.equal(normalizeArticleSummary(on(["a", "  ", 3, null])), null);
  assert.equal(normalizeArticleSummary(on("a")), null);
});

test("normalizer trims, dedupes, caps at four and splits first/rest", () => {
  const r = normalizeArticleSummary(
    on([" एक ", "दुई", "दुई", "", "तीन", "चार", "पाँच"]),
  );
  assert.equal(r.first, "एक");
  assert.deepEqual(r.more, ["दुई", "तीन", "चार"]);
  const two = normalizeArticleSummary(on(["a", "b"]));
  assert.deepEqual(two.more, ["b"]);
});

test("AI disclosure flag defaults to true but never changes the summary items", () => {
  assert.equal(normalizeArticleSummary(on(["a", "b"])).aiAssisted, true);
  assert.equal(
    normalizeArticleSummary(on(["a", "b"], { aiAssisted: false })).aiAssisted,
    false,
  );
  assert.deepEqual(
    normalizeArticleSummary(on(["a", "b"], { aiAssisted: false })),
    {
      first: "a",
      more: ["b"],
      aiAssisted: false,
    },
  );
});

test("AI disclosure is hidden while collapsed and shown only while expanded", async () => {
  const [schema, src] = await Promise.all([
    read("../../sanity/schemaTypes/articleSummary.ts"),
    read("../../src/components/content/ArticleSummary.astro"),
  ]);
  assert.match(
    schema,
    /name: 'aiAssisted'[\s\S]*title: 'Prepared with AI assistance'[\s\S]*initialValue: true/,
  );
  assert.match(
    schema,
    /Turn this off if the summary was written entirely by an editor/,
  );
  const hidden = normalizeArticleSummary(
    on(["a", "b", "c"], { aiAssisted: false }),
  );
  assert.equal(hidden.first, "a");
  assert.deepEqual(hidden.more, ["b", "c"]);
  assert.match(
    src,
    /content\.aiAssisted && <p class="article-summary__disclosure"/,
  );
  assert.match(
    src,
    /\.article-summary\[data-enhanced\]:not\(\[data-expanded\]\)\s+\.article-summary__disclosure\s*\{\s*display: none;/,
  );
  assert.match(
    src,
    /\.article-summary__footer--note,[\s\S]*?\.article-summary\[data-enhanced\] \.article-summary__footer/,
  );
  assert.doesNotMatch(src, /\{content\.aiAssisted && \(?\s*<section/);
});

test("no-JS footer remains absent without a disclosure and has no collapsed disclosure gap", async () => {
  const src = await read("../../src/components/content/ArticleSummary.astro");
  assert.match(src, /\.article-summary__footer \{\s*display: none;/);
  assert.match(
    src,
    /\.article-summary__footer--note,\s*\.article-summary\[data-enhanced\] \.article-summary__footer \{\s*display: flex;/,
  );
  assert.match(src, /"article-summary__footer--note": content\.aiAssisted/);
  assert.match(
    src,
    /\.article-summary\[data-enhanced\]:not\(\[data-expanded\]\)[\s\S]*?display: none;/,
  );
  assert.match(src, /content\.more\.map\(\(item\) => \(\s*<li>\{item\}<\/li>/);
  assert.match(src, /<button[\s\S]*?data-summary-toggle/);
  assert.match(src, /min-height: 2\.75rem/);
  assert.match(
    src,
    /\.article-summary__disclosure \{\s*margin: 0;[\s\S]*?font-size: 0\.95rem;/,
  );
  assert.match(
    src,
    /@media \(min-width: 40rem\)[\s\S]*?\.article-summary__footer \{\s*flex-direction: row;/,
  );
  assert.match(src, /@media \(prefers-reduced-motion: reduce\)/);
});

test("IDs are stable, unique per document and draft-agnostic", () => {
  const a = articleSummaryIds("drafts.abc-1");
  assert.deepEqual(a, articleSummaryIds("abc-1"));
  assert.notDeepEqual(a, articleSummaryIds("abc-2"));
  assert.equal(new Set(Object.values(a)).size, 3);
  for (const id of Object.values(a)) assert.match(id, /^[A-Za-z][\w-]*$/);
});

test("component source: accessibility, progressive enhancement, styling", async () => {
  const src = await read("../../src/components/content/ArticleSummary.astro");
  assert.match(src, /<button[\s\S]*type="button"/);
  assert.match(src, /aria-expanded/);
  assert.match(src, /aria-controls=\{ids\.region\}/);
  assert.match(src, /role="group"[\s\S]*aria-labelledby/);
  assert.match(src, /<svg[\s\S]*aria-hidden="true"/);
  assert.match(src, /\.article-summary__toggle \{\s*display: none;/);
  assert.match(
    src,
    /\[data-enhanced\] \.article-summary__toggle \{\s*display: inline-block;/,
  );
  assert.match(
    src,
    /:not\(\[data-expanded\]\) \.article-summary__more \{\s*height: 0;\s*visibility: hidden;/,
  );
  assert.match(
    src,
    /<section[^>]*data-article-summary[^>]*>\s*<script is:inline>/,
  );
  assert.match(src, /catch \(error\)/);
  assert.match(src, /prefers-reduced-motion/);
  assert.match(src, /visibility: hidden/);
  assert.match(src, /var\(--color-brand-50\)/);
  assert.match(src, /var\(--color-brand-200\)/);
  assert.match(src, /var\(--color-brand-700\)/);
  assert.doesNotMatch(src.replace(/color: #fff;/, ""), /#[0-9a-fA-F]{3,8}\b/);
  assert.doesNotMatch(
    src,
    /line-clamp|height:\s*auto;[\s\S]{0,40}transition|box-shadow|gradient|ResizeObserver|MutationObserver/,
  );
  assert.doesNotMatch(src, /openai|anthropic|gemini|chatgpt|fetch\(/i);
  assert.doesNotMatch(src, /[\u{1F300}-\u{1FAFF}\u2728]/u);
  assert.doesNotMatch(src, /html\[lang="ne"\][^{]*\{[^}]*text-wrap:\s*balance/);
});

test("component text comes from translations, not hardcoded", async () => {
  const src = await read("../../src/components/content/ArticleSummary.astro");
  assert.match(src, /commonText\.articleSummary/);
  assert.match(src, /commonText\.showMore/);
  assert.match(src, /commonText\.showLess/);
  for (const s of ["Kort fortalt", "छोटकरीमा", "Show more", "Vis mer"])
    assert.ok(!src.includes(s));
});

test("GROQ projects only the needed fields in both by-slug queries", async () => {
  const q = await read("../../src/lib/sanity/queries.ts");
  const matches =
    q.match(/articleSummary \{\s*enabled,\s*items,\s*aiAssisted,?\s*\}/g) ?? [];
  assert.equal(matches.length, 2);
});

test("pages render the summary before the body", async () => {
  const news = await read("../../src/pages/[lang]/news/[slug].astro");
  const guide = await read("../../src/pages/[lang]/info/[slug].astro");
  assert.ok(
    news.indexOf("<ArticleSummary") <
      news.indexOf('class="prose article-body"'),
  );
  assert.ok(
    guide.indexOf("<ArticleSummary") <
      guide.indexOf('class="prose guide-content"'),
  );
  assert.match(news, /summary=\{article\.articleSummary\}/);
  assert.match(guide, /summary=\{guide\.articleSummary\}/);
  assert.match(news, /documentId=\{article\._id\}/);
  assert.match(guide, /documentId=\{guide\._id\}/);
});
