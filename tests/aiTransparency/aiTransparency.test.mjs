import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { getTranslationModule } from "../../src/lib/translationBrowser/registry.ts";
import {
  translationLanguages,
  isTranslationLanguage,
} from "../../src/lib/translationBrowser/registry.ts";
import { validateTranslationProposal } from "../../src/lib/translationBrowser/validateProposal.ts";
import { updateTranslationSources } from "../../src/lib/translationGitHub/sourceUpdate.ts";
import {
  AI_PAGE_KEYS,
  AI_PAGE_LANGUAGES,
  buildAiPageDocumentId,
  buildAiPagePath,
  normalizeAiTransparencyPage,
  resolveAiAlternatePath,
  resolveAiInformationLink,
} from "../../src/lib/aiTransparency/pages.ts";
import {
  buildSeedDocuments,
  buildSeedNdjson,
} from "../../sanity/seed/build-ai-transparency-seed.mjs";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

const block = (text, extra = {}) => ({
  _type: "block",
  _key: `k-${text}`,
  style: "normal",
  children: [{ _type: "span", _key: "s1", text, marks: [] }],
  markDefs: [],
  ...extra,
});

const page = (overrides = {}) => ({
  pageKey: "aiInformation",
  language: "ne",
  title: "  Title  ",
  summary: " Intro ",
  body: [block("Hello")],
  ...overrides,
});

const normalize = (input, options = {}) =>
  normalizeAiTransparencyPage(input, {
    key: "aiInformation",
    language: "ne",
    ...options,
  });

// ---- Editable page model ----------------------------------------------

test("schema is registered with fixed page keys, languages and no English", async () => {
  const schema = await read("../../sanity/schemaTypes/aiTransparencyPage.ts");
  const index = await read("../../sanity/schemaTypes/index.ts");
  const config = await read("../../sanity/sanity.config.ts");
  assert.match(index, /aiTransparencyPage,/);
  assert.match(config, /documentTypeList\('aiTransparencyPage'\)/);
  assert.match(schema, /name: 'aiTransparencyPage'/);
  assert.match(schema, /value: 'aiInformation'/);
  assert.match(schema, /value: 'aiGuidelines'/);
  assert.match(schema, /value: 'ne'/);
  assert.match(schema, /value: 'nb'/);
  assert.doesNotMatch(schema, /value: 'en'/);
  // The route-defining fields cannot be edited after the first save.
  assert.equal(
    (
      schema.match(
        /readOnly: \(\{document\}\) => Boolean\(document\?\._createdAt\)/g,
      ) ?? []
    ).length,
    2,
  );
  assert.match(schema, /already exists/);
  for (const field of [
    "title",
    "summary",
    "body",
    "seoTitle",
    "seoDescription",
    "lastReviewedAt",
  ]) {
    assert.match(schema, new RegExp(`name: '${field}'`), field);
  }
  // Counterparts resolve from pageKey + language, so no reference is stored.
  assert.doesNotMatch(schema, /name: 'translation'/);
});

test("schema body is a constrained rich-text array with safe links only", async () => {
  const schema = await read("../../sanity/schemaTypes/aiTransparencyPage.ts");
  const body = schema.slice(schema.indexOf("name: 'body'"));
  for (const style of ["normal", "h2", "h3", "blockquote"]) {
    assert.match(body, new RegExp(`value: '${style}'`));
  }
  assert.match(body, /value: 'bullet'/);
  assert.match(body, /value: 'number'/);
  assert.match(body, /value: 'strong'/);
  assert.match(body, /value: 'em'/);
  assert.match(body, /scheme: \['http', 'https'\]/);
  assert.match(body, /name: 'internalPageLink'/);
  assert.match(body, /Add meaningful page content/);
  // No custom blocks, media, embeds, HTML or tables.
  for (const forbidden of [
    "type: 'image'",
    "editorialChart",
    "informationBox",
    "expandableSection",
    "readAlso",
    "articleSummary",
    "html",
    "table",
    "embed",
  ]) {
    assert.ok(!body.includes(forbidden), forbidden);
  }
  assert.equal((body.match(/defineArrayMember\(/g) ?? []).length, 1);
});

test("normalizer requires matching page, language, title and meaningful body", () => {
  assert.equal(normalize(null), null);
  assert.equal(normalize(page({ pageKey: "aiGuidelines" })), null);
  assert.equal(normalize(page({ language: "nb" })), null);
  assert.equal(normalize(page({ title: "   " })), null);
  assert.equal(normalize(page({ body: [] })), null);
  assert.equal(normalize(page({ body: [block("   ")] })), null);
  assert.equal(normalize(page({ body: [{ _type: "image" }] })), null);
  const result = normalize(page());
  assert.equal(result.title, "Title");
  assert.equal(result.summary, "Intro");
  assert.equal(result.seoTitle, "Title");
  assert.equal(result.seoDescription, "Intro");
});

test("normalizer accepts the null fields a GROQ projection returns", () => {
  const result = normalize(
    page({
      body: [
        block("Heading", { style: "h2", listItem: null, level: null }),
        block("Item", { listItem: "bullet", level: 1 }),
      ],
    }),
  );
  assert.equal(result.body.length, 2);
  assert.equal(result.body[0].listItem, undefined);
  assert.equal(result.body[1].listItem, "bullet");
});

test("normalizer drops unsupported blocks, styles and unsafe links", () => {
  const body = [
    block("ok", { style: "h2" }),
    block("custom", { _type: "informationBox" }),
    block("h4 style", { style: "h4" }),
    { _type: "expandableSection", title: "x" },
    block("bad list", { listItem: "square" }),
    block("link text", {
      children: [
        { _type: "span", _key: "a", text: "safe", marks: ["ok"] },
        { _type: "span", _key: "b", text: "script", marks: ["js"] },
        {
          _type: "span",
          _key: "c",
          text: "rel",
          marks: ["rel", "strong", "code"],
        },
      ],
      markDefs: [
        { _type: "link", _key: "ok", href: "https://example.org/a" },
        { _type: "link", _key: "js", href: "javascript:alert(1)" },
        { _type: "link", _key: "rel", href: "/ne/about/" },
      ],
    }),
  ];
  const { body: out } = normalize(page({ body }));
  assert.deepEqual(
    out.map((b) => b.style),
    ["h2", "normal"],
  );
  const spans = out[1].children;
  assert.deepEqual(spans[0].marks, ["ok"]);
  assert.deepEqual(spans[1].marks, []);
  assert.deepEqual(spans[2].marks, ["rel", "strong"]);
  assert.deepEqual(
    out[1].markDefs.map((d) => d.href),
    ["https://example.org/a", "/ne/about/"],
  );
});

test("internal page links resolve per language and only to published AI pages", () => {
  const linked = (target) =>
    block("go", {
      children: [{ _type: "span", _key: "a", text: "go", marks: ["m"] }],
      markDefs: [{ _type: "internalPageLink", _key: "m", pageKey: target }],
    });
  const hrefOf = (target, options) =>
    normalize(page({ body: [linked(target), block("x")] }), options).body[0]
      .markDefs[0]?.href;

  assert.equal(
    hrefOf("aiGuidelines", { availablePages: ["aiGuidelines"] }),
    "/ne/ai-guidelines/",
  );
  assert.equal(hrefOf("contact"), "/ne/contact/");
  assert.equal(
    normalize(
      page({ language: "nb", body: [linked("aiGuidelines"), block("x")] }),
      {
        language: "nb",
        availablePages: ["aiGuidelines"],
      },
    ).body[0].markDefs[0].href,
    "/nb/ai-guidelines/",
  );
  // Missing target page and unknown targets leave plain text, never a broken link.
  assert.equal(hrefOf("aiGuidelines", { availablePages: [] }), undefined);
  assert.equal(hrefOf("../admin"), undefined);
  assert.equal(hrefOf("__proto__"), undefined);
  const plain = normalize(page({ body: [linked("aiGuidelines")] })).body[0];
  assert.deepEqual(plain.children[0].marks, []);
});

test("translation counterpart handling falls back to the transparency page", () => {
  assert.equal(
    resolveAiAlternatePath({
      key: "aiInformation",
      language: "ne",
      alternateAvailable: true,
    }),
    "/nb/ai-information/",
  );
  assert.equal(
    resolveAiAlternatePath({
      key: "aiGuidelines",
      language: "nb",
      alternateAvailable: true,
    }),
    "/ne/ai-guidelines/",
  );
  assert.equal(
    resolveAiAlternatePath({
      key: "aiInformation",
      language: "ne",
      alternateAvailable: false,
    }),
    "/nb/transparency/",
  );
});

// ---- Routes ----------------------------------------------------------

test("stable routes follow the existing /{lang}/{segment}/ convention without English", () => {
  assert.equal(buildAiPagePath("aiInformation", "ne"), "/ne/ai-information/");
  assert.equal(buildAiPagePath("aiInformation", "nb"), "/nb/ai-information/");
  assert.equal(buildAiPagePath("aiGuidelines", "ne"), "/ne/ai-guidelines/");
  assert.equal(buildAiPagePath("aiGuidelines", "nb"), "/nb/ai-guidelines/");
  assert.equal(buildAiPagePath("aiInformation", "en"), undefined);
  assert.equal(buildAiPagePath("other", "ne"), undefined);
  assert.deepEqual([...AI_PAGE_LANGUAGES], ["ne", "nb"]);
  assert.equal(
    buildAiPageDocumentId("aiGuidelines", "nb"),
    "ai-transparency-page-ai-guidelines-nb",
  );
});

test("route files fetch the published perspective, redirect safely and reject English", async () => {
  for (const [file, key] of [
    ["ai-information", "aiInformation"],
    ["ai-guidelines", "aiGuidelines"],
  ]) {
    const source = await read(`../../src/pages/[lang]/${file}.astro`);
    assert.match(source, /export const prerender = false/);
    assert.match(source, new RegExp(`const pageKey = ["']${key}["']`));
    assert.match(source, /isAiPageLanguage\(lang\)/);
    assert.match(
      source,
      /Astro\.redirect\(`\/\$\{language\}\/transparency\/`\)/,
    );
    assert.match(source, /normalizeAiTransparencyPage/);
    assert.match(source, /resolveAiAlternatePath/);
  }
  const astroConfig = await read("../../astro.config.mjs");
  assert.match(astroConfig, /perspective: "published"/);
  const query = await read("../../src/lib/sanity/queries.ts");
  const start = query.indexOf("export const AI_TRANSPARENCY_PAGE_QUERY");
  const aiQuery = query.slice(start);
  assert.match(aiQuery, /_type == "aiTransparencyPage"/);
  assert.doesNotMatch(aiQuery, /drafts\./);
  const { existsSync } = await import("node:fs");
  assert.equal(
    existsSync(
      new URL("../../src/pages/en/ai-information.astro", import.meta.url),
    ),
    false,
  );
  assert.equal(
    existsSync(
      new URL("../../src/pages/en/ai-guidelines.astro", import.meta.url),
    ),
    false,
  );
});

test("metadata comes from SEO fields with canonical handled by the base layout", async () => {
  const layout = await read("../../src/layouts/StaticPageLayout.astro");
  assert.match(layout, /metaTitle \?\? title/);
  assert.match(layout, /metaDescription \?\? description/);
  const base = await read("../../src/layouts/BaseLayout.astro");
  assert.match(base, /rel="canonical"/);
  const view = await read(
    "../../src/components/content/AiTransparencyPageView.astro",
  );
  assert.match(view, /metaTitle=\{page\.seoTitle\}/);
  assert.match(
    view,
    /metaDescription=\{page\.seoDescription \|\| page\.title\}/,
  );
  assert.doesNotMatch(view, /socialImage|<img/);
  assert.equal(
    normalize(page({ seoTitle: " SEO ", seoDescription: " Desc " })).seoTitle,
    "SEO",
  );
});

// ---- Article option --------------------------------------------------

test("showAiInformationLink is an optional boolean in News and Guides", async () => {
  for (const file of ["newsArticle", "publicInformationGuide"]) {
    const schema = await read(`../../sanity/schemaTypes/${file}.ts`);
    const start = schema.indexOf("name: 'showAiInformationLink'");
    assert.ok(start > 0, file);
    const field = schema.slice(start, schema.indexOf("}),", start));
    assert.match(field, /title: 'Show link to AI information'/);
    assert.match(field, /type: 'boolean'/);
    assert.match(
      field,
      /Displays a link to nepali\.no’s general information about AI use\. This does not replace image credits or the Article Summary AI disclosure\./,
    );
    assert.doesNotMatch(
      field,
      /validation|initialValue|aiAssisted|credit\b.*=>|url/i,
    );
  }
});

test("article link renders only when enabled and the localized page is published", () => {
  const link = (over) =>
    resolveAiInformationLink({
      enabled: true,
      available: true,
      language: "ne",
      ...over,
    });
  assert.deepEqual(link(), { href: "/ne/ai-information/" });
  assert.deepEqual(link({ language: "nb" }), { href: "/nb/ai-information/" });
  assert.equal(link({ enabled: undefined }), null);
  assert.equal(link({ enabled: false }), null);
  assert.equal(link({ enabled: "true" }), null);
  assert.equal(link({ available: false }), null);
  assert.equal(link({ available: undefined }), null);
  assert.equal(link({ language: "en" }), null);
});

test("queries add only the flag and an availability check to News and Guides", async () => {
  const query = await read("../../src/lib/sanity/queries.ts");
  for (const name of [
    "NEWS_ARTICLE_BY_SLUG_QUERY",
    "PUBLIC_INFORMATION_GUIDE_BY_SLUG_QUERY",
  ]) {
    const start = query.indexOf(`export const ${name}`);
    const text = query.slice(start, query.indexOf("`;", start));
    assert.match(text, /showAiInformationLink,/);
    assert.match(text, /"aiInformationAvailable": count\(\*\[/);
    assert.match(text, /pageKey == "aiInformation"/);
    assert.match(text, /language == \^\.language/);
  }
  const flag = query.indexOf('"aiInformationAvailable"');
  assert.doesNotMatch(query.slice(flag, flag + 220), /aiAssisted|credit|alt\b/);
});

test("link is placed after the body and before Forum content in News and Guides", async () => {
  const news = await read("../../src/pages/[lang]/news/[slug].astro");
  const guide = await read("../../src/pages/[lang]/info/[slug].astro");
  const at = (source, text) => source.indexOf(text);
  assert.ok(at(news, "<AiInformationLink") > at(news, "<PortableText"));
  assert.ok(at(news, "<AiInformationLink") > at(news, "source-note"));
  assert.ok(at(news, "<AiInformationLink") < at(news, "<ForumDiscussionCard"));
  assert.ok(at(guide, "<AiInformationLink") > at(guide, "<PortableText"));
  assert.ok(at(guide, "<AiInformationLink") > at(guide, "funding-heading"));
  assert.ok(
    at(guide, "<AiInformationLink") < at(guide, "<ForumDiscussionCard"),
  );
  for (const source of [news, guide]) {
    assert.match(source, /enabled=\{(article|guide)\.showAiInformationLink\}/);
    assert.match(
      source,
      /available=\{(article|guide)\.aiInformationAvailable\}/,
    );
  }
});

// ---- Accessibility ---------------------------------------------------

test("article link is an accessible anchor with a decorative icon", async () => {
  const source = await read(
    "../../src/components/content/AiInformationLink.astro",
  );
  assert.match(source, /<svg[^>]*aria-hidden="true"/s);
  assert.match(source, /<svg[^>]*focusable="false"/s);
  assert.equal((source.match(/<a /g) ?? []).length, 1);
  assert.doesNotMatch(source, /<button|<details|role=/);
  assert.match(source, /<a href=\{link\.href\}/);
  assert.match(source, /a:focus-visible/);
  assert.match(source, /min-height: 2\.75rem/);
  assert.match(source, /text-decoration: underline/);
  assert.match(source, /articleLinkLabel/);
  assert.doesNotMatch(source, /animation|transition|#[0-9a-f]{3,8}\b|rgb\(/i);
  assert.doesNotMatch(source, /<script|target=/);
});

// ---- Translation Editor ---------------------------------------------

test("Translation Editor discovers, validates and targets the article-link label", async () => {
  const expected = {
    ne: "nepali.no मा एआईको प्रयोगबारे जानकारी",
    nb: "Informasjon om KI-bruk i nepali.no",
  };
  for (const language of ["ne", "nb"]) {
    const mod = getTranslationModule(language, "footer-common");
    const entries = new Map(mod.entries.map((e) => [e.key, e.value]));
    const key = "common.aiInformation.articleLinkLabel";
    assert.equal(entries.get(key), expected[language]);
    const result = validateTranslationProposal({
      language,
      module: "footer-common",
      changes: [
        {
          key,
          originalValue: entries.get(key),
          proposedValue: `${expected[language]} ` + "x",
        },
      ],
    });
    assert.equal(result.ok, true);
    const path = `src/i18n/${language}.ts`;
    const source = await read(`../../${path}`);
    const updated = updateTranslationSources(
      language,
      "footer-common",
      result.changes,
      new Map([[path, source]]),
    );
    assert.equal(updated.files[0].filePath ?? path, path);
    assert.deepEqual(updated.files[0].changedKeys, [key]);
  }
});

test("English fallback exists but English stays inactive in the Translation Editor", async () => {
  const { en } = await import("../../src/i18n/en.ts");
  assert.equal(
    en.common.aiInformation.articleLinkLabel,
    "Information about AI use at nepali.no",
  );
  assert.deepEqual([...translationLanguages], ["ne", "nb"]);
  assert.equal(isTranslationLanguage("en"), false);
});

// ---- Initial content -------------------------------------------------

test("seed import builds four stable, idempotent draft documents that render", () => {
  const documents = buildSeedDocuments();
  assert.equal(documents.length, 4);
  assert.equal(new Set(documents.map((d) => d._id)).size, 4);
  for (const key of AI_PAGE_KEYS) {
    for (const language of AI_PAGE_LANGUAGES) {
      const doc = documents.find(
        (d) => d.pageKey === key && d.language === language,
      );
      assert.ok(doc, `${key} ${language}`);
      assert.equal(doc._id, `drafts.${buildAiPageDocumentId(key, language)}`);
      assert.equal(doc._type, "aiTransparencyPage");
      const normalized = normalizeAiTransparencyPage(doc, {
        key,
        language,
        availablePages: AI_PAGE_KEYS,
      });
      assert.ok(normalized, `${key} ${language} normalizes`);
      assert.equal(
        normalized.body.length,
        doc.body.length,
        "no block was dropped",
      );
      assert.equal(
        new Set(doc.body.map((b) => b._key)).size,
        doc.body.length,
        "unique block keys",
      );
    }
  }
  assert.equal(buildSeedNdjson(), buildSeedNdjson());
});

test("seed file on disk is current and uses the required titles and principle", async () => {
  const onDisk = await read("../../sanity/seed/ai-transparency-pages.ndjson");
  assert.equal(onDisk, buildSeedNdjson());
  const docs = buildSeedDocuments();
  const title = (key, language) =>
    docs.find((d) => d.pageKey === key && d.language === language).title;
  assert.equal(title("aiInformation", "ne"), "nepali.no मा एआईको प्रयोग");
  assert.equal(title("aiInformation", "nb"), "Bruk av KI i nepali.no");
  assert.equal(
    title("aiGuidelines", "ne"),
    "nepali.no का सम्पादकीय एआईसम्बन्धी दिशानिर्देश",
  );
  assert.equal(
    title("aiGuidelines", "nb"),
    "Redaksjonelle retningslinjer for bruk av KI i nepali.no",
  );
  const textOf = (doc) =>
    doc.body.map((b) => b.children.map((c) => c.text).join("")).join("\n");
  const principle = {
    ne: "एआईले काममा सहयोग गर्न सक्छ, तर प्रकाशित सामग्रीको निर्णय, जाँच र जिम्मेवारी सधैं मानिसकै हुन्छ।",
    nb: "KI kan støtte arbeidet, men beslutningen, kontrollen og ansvaret for publisert innhold ligger alltid hos mennesker.",
  };
  const guidelinesLinkText = {
    ne: "nepali.no का विस्तृत सम्पादकीय एआईसम्बन्धी दिशानिर्देश पढ्नुहोस्।",
    nb: "Les nepali.no sine fullstendige redaksjonelle retningslinjer for bruk av KI.",
  };
  for (const language of ["ne", "nb"]) {
    const short = docs.find(
      (d) => d.pageKey === "aiInformation" && d.language === language,
    );
    const detailed = docs.find(
      (d) => d.pageKey === "aiGuidelines" && d.language === language,
    );
    assert.ok(textOf(short).includes(principle[language]));
    assert.ok(textOf(detailed).includes(principle[language]));
    const link = short.body.find((b) =>
      b.children.some((c) => c.text === guidelinesLinkText[language]),
    );
    assert.ok(link, "short page links to the detailed page");
    assert.equal(link.markDefs[0]._type, "internalPageLink");
    assert.equal(link.markDefs[0].pageKey, "aiGuidelines");
    assert.equal(
      detailed.body.filter((b) => b.style === "h2").length,
      12,
      "twelve sections",
    );
  }
});

// ---- Safety ----------------------------------------------------------

test("new code makes no AI call, publishes nothing and hardcodes no vendors or trackers", async () => {
  const files = [
    "../../src/lib/aiTransparency/pages.ts",
    "../../src/components/content/AiInformationLink.astro",
    "../../src/components/content/AiTransparencyPageView.astro",
    "../../src/pages/[lang]/ai-information.astro",
    "../../src/pages/[lang]/ai-guidelines.astro",
    "../../sanity/schemaTypes/aiTransparencyPage.ts",
    "../../sanity/seed/aiTransparencyPages.content.mjs",
  ];
  for (const file of files) {
    const source = await read(file);
    assert.doesNotMatch(
      source,
      /openai|anthropic|chatgpt|gpt-|gemini|claude|copilot|midjourney|dall-?e|stable diffusion/i,
      file,
    );
    assert.doesNotMatch(
      source,
      /fetch\(\s*['"`]https?:|api\.openai|\.mutate\(|\.create\(|\.createOrReplace\(|\.patch\(|\.commit\(/,
      file,
    );
    assert.doesNotMatch(
      source,
      /<script|googletagmanager|analytics|dangerouslySetInnerHTML|set:html/i,
      file,
    );
  }
  const seed = await read("../../sanity/seed/build-ai-transparency-seed.mjs");
  assert.match(seed, /drafts\.ai-transparency-page/);
  assert.match(seed, /--missing/);
});
