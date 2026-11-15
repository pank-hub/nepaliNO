import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import test from 'node:test'
import {orderGuidanceHubTopics} from '../../src/config/guidanceHub.ts'

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')
const [
  page,
  hubHelper,
  masthead,
  recentPackage,
  topicShowcase,
  icons,
  queries,
  homepageTopics,
  homepagePage,
  search,
  guideRoute,
  ne,
  nb,
] = await Promise.all([
  read('../../src/pages/[lang]/info/index.astro'),
  read('../../src/lib/guidanceHub.ts'),
  read('../../src/components/guidance/GuidanceMasthead.astro'),
  read('../../src/components/guidance/GuidanceRecentPackage.astro'),
  read('../../src/components/guidance/GuidanceTopicShowcase.astro'),
  read('../../src/components/content/GuidanceTopicIcon.astro'),
  read('../../src/lib/sanity/queries.ts'),
  read('../../src/config/homepage.ts'),
  read('../../src/pages/[lang]/index.astro'),
  read('../../src/lib/guideSearch.ts'),
  read('../../src/pages/[lang]/info/topic/[slug].astro'),
  read('../../src/i18n/ne.ts'),
  read('../../src/i18n/nb.ts'),
])

const iconTopicKeys = [
  'immigration-residence',
  'moving-population-register',
  'work-employment',
  'tax-finance',
  'rights-safety-discrimination',
  'other',
  'housing',
  'digital-services-eid',
  'language-integration',
  'citizenship-participation',
  'family-children',
  'transport-driving',
  'education-student-life',
  'health-services',
]

test('public hub prioritizes eight stable keys, preserves remaining order and places other last', () => {
  const topics = iconTopicKeys.map((topicKey, index) => ({
    topicKey,
    title: `Title ${index}`,
    guideCount: index,
    slug: `slug-${index}`,
  }))
  const original = [...topics]
  const ordered = orderGuidanceHubTopics(topics)
  assert.deepEqual(
    ordered.map((topic) => topic.topicKey),
    [
      'immigration-residence',
      'health-services',
      'work-employment',
      'family-children',
      'rights-safety-discrimination',
      'housing',
      'education-student-life',
      'tax-finance',
      'moving-population-register',
      'digital-services-eid',
      'language-integration',
      'citizenship-participation',
      'transport-driving',
      'other',
    ],
  )
  assert.equal(ordered.length, 14)
  assert.equal(new Set(ordered.map((topic) => topic.topicKey)).size, 14)
  assert.deepEqual(topics, original)
  for (const topic of topics) assert.ok(ordered.includes(topic))
  assert.match(hubHelper, /const orderedTopics = orderGuidanceHubTopics\(topics\)/)
  assert.match(page, /composeGuidanceHub\(sanityTopics, guides\)/)
})

test('hub ordering retains unknown topics and their input order without relying on titles', () => {
  const topics = [
    {topicKey: 'other', title: 'First'},
    {topicKey: 'future-topic-b', title: 'Z'},
    {topicKey: 'digital-services-eid', title: 'A'},
    {topicKey: 'future-topic-a', title: 'A'},
    {topicKey: 'housing', title: 'Last'},
  ]
  assert.deepEqual(
    orderGuidanceHubTopics(topics).map((topic) => topic.topicKey),
    ['housing', 'future-topic-b', 'digital-services-eid', 'future-topic-a', 'other'],
  )
  assert.deepEqual(orderGuidanceHubTopics([]), [])
  assert.deepEqual(orderGuidanceHubTopics([{topicKey: 'other'}]), [{topicKey: 'other'}])
})

test('Guidance hub follows masthead, search, recent package, topic showcase, trust notice and fallback/search list', () => {
  const mastheadIdx = page.indexOf('<GuidanceMasthead')
  const searchIdx = page.indexOf('class="info-search"')
  const recentIdx = page.indexOf('data-recent-section')
  const topicsIdx = page.indexOf('<GuidanceTopicShowcase')
  const noticeIdx = page.indexOf('class="info-trust-strip"')
  const guidesIdx = page.indexOf('class="guides-section section-sm"')
  assert.ok(
    mastheadIdx >= 0 &&
      mastheadIdx < searchIdx &&
      searchIdx < recentIdx &&
      recentIdx < topicsIdx &&
      topicsIdx < noticeIdx &&
      noticeIdx < guidesIdx,
  )
  assert.doesNotMatch(page, /<main\b/)
  assert.match(page, /bodyClass="guidance-hub"/)
  assert.match(masthead, /labels\.pageTitle/)
  assert.match(masthead, /labels\.pageDescription/)
  assert.match(masthead, /border-top: 3px solid var\(--civic-deep\)/)
  assert.match(recentPackage, /urgent-strip/)
  assert.match(recentPackage, /lead-spotlight/)
  assert.match(recentPackage, /recent-rail/)
  assert.match(page, /<form class="info-search__form" role="search" data-guide-search-form>/)
  assert.match(page, /matchesGuideSearch/)
  assert.match(page, /buildGuideSearchText\(guide\)/)
  assert.match(page, /data-search-text=\{searchText\}/)
  assert.match(page, /if \(recentSection\) recentSection\.hidden = true/)
  assert.match(page, /if \(recentSection\) recentSection\.hidden = false/)
  assert.match(page, /labels\.information\.searchPlaceholder/)
  assert.match(page, /class="sr-only" for="guide-search-input"/)
  assert.match(page, /role="status"[\s\S]*aria-live="polite"[\s\S]*data-guide-search-status/)
  assert.match(page, /labels\.information\.searchHint/)
  assert.doesNotMatch(page, /ContentSearch|data-content-search/)
  assert.doesNotMatch(page, /\.searchKeywords/)
})

test('Guidance notice retains the central disclaimer in a compact neutral treatment', () => {
  assert.match(
    page,
    /<h2 id="information-disclaimer-title">[\s\S]*<span>\{labels\.information\.disclaimerTitle\}<\/span>\s*<\/h2>/,
  )
  assert.match(page, /<p>\{labels\.information\.disclaimer\}<\/p>/)
  assert.match(
    page,
    /\.trust-notice\s*\{[^}]*padding: 0\.9rem 1rem;[^}]*border: 1px solid var\(--border\);[^}]*border-radius: var\(--radius-md\);[^}]*background: var\(--surface-muted\);/,
  )
  assert.match(
    page,
    /\.trust-notice p\s*\{[^}]*color: var\(--text-muted\);[^}]*line-height: 1\.8;/,
  )
  const noticeStyles = page.slice(
    page.indexOf('.trust-notice {'),
    page.indexOf('.guides-section {'),
  )
  assert.doesNotMatch(noticeStyles, /warning|var\(--brand\)/)
})

test('notice information icon is decorative, aligned and matches the topic outline family', () => {
  const heading = page.match(/<h2 id="information-disclaimer-title">([\s\S]*?)<\/h2>/)?.[1]
  assert.ok(heading)
  assert.match(heading, /<svg[^>]*\swidth="20"[\s\S]*\sheight="20"/)
  for (const attribute of [
    'viewBox="0 0 24 24"',
    'fill="none"',
    'stroke="currentColor"',
    'stroke-width="1.6"',
    'stroke-linecap="round"',
    'stroke-linejoin="round"',
    'aria-hidden="true"',
    'focusable="false"',
  ]) {
    assert.ok(heading.includes(attribute))
    assert.ok(icons.includes(attribute))
  }
  assert.match(heading, /<circle cx="12" cy="12" r="9"><\/circle>/)
  assert.match(heading, /<path d="M12 11v6M12 7h\.01"><\/path>/)
  assert.ok(heading.indexOf('</svg>') < heading.indexOf('<span>'))
  assert.doesNotMatch(heading, /<title|role=|aria-label=|background|shadow/)
  assert.match(
    page,
    /\.trust-notice h2\s*\{[^}]*display: flex;[^}]*align-items: center;[^}]*gap: 0\.5rem;/,
  )
  assert.match(
    page,
    /\.trust-notice h2 svg\s*\{[^}]*flex: 0 0 20px;[^}]*width: 20px;[^}]*height: 20px;[^}]*color: var\(--civic-deep\);/,
  )
})

test('active topic query uses Sanity display order and TopicShowcase preserves counts, icons, and empty-topic handling', () => {
  const topicQuery = queries.slice(
    queries.indexOf('export const PUBLIC_INFORMATION_TOPICS_BY_LANGUAGE_QUERY'),
    queries.indexOf('export const PUBLIC_INFORMATION_TOPIC_BY_SLUG_QUERY'),
  )
  assert.match(
    topicQuery,
    /isActive == true[\s\S]*defined\(slug\.current\)[\s\S]*order\(displayOrder asc, title asc\)/,
  )
  assert.match(
    topicQuery,
    /"guideCount": count\(\*\[[\s\S]*language == \^\.language[\s\S]*topic == \^\.topicKey[\s\S]*status == "active"[\s\S]*defined\(slug\.current\)/,
  )
  assert.match(topicShowcase, /coreTopics\.map/)
  assert.match(topicShowcase, /directoryTopics\.map/)
  assert.doesNotMatch(page, /selectHomepageGuidanceTopics|homepageGuidanceTopicKeys|topics\.slice/)
  assert.match(topicShowcase, /topicHref\(language, topic\.slug\)/)
  assert.match(topicShowcase, /data-guide-count=\{topic\.guideCount\}/)
  assert.match(topicShowcase, /formatTopicCount\(topic\.guideCount\)/)
  assert.match(topicShowcase, /topic\.guideCount === 0/)
  assert.match(topicShowcase, /labels\.noPublishedTopicGuides/)
  assert.match(topicShowcase, /<GuidanceTopicIcon topicKey=\{topic\.topicKey\} \/>/)
  assert.match(topicShowcase, /var\(--surface-muted\)/)
  assert.match(topicShowcase, /min-height: 44px/)
  assert.match(guideRoute, /emptyTitle: 'यस विषयमा मार्गदर्शन तयार हुँदैछन्'/)
  assert.match(guideRoute, /emptyTitle: 'Veiledninger for dette temaet er under arbeid'/)
})

test('Topic Hub route uses editorial masthead, icon, breadcrumbs, and clean directory without 22rem cards', () => {
  assert.doesNotMatch(guideRoute, /<main\b/)
  assert.match(guideRoute, /bodyClass="guidance-topic-hub"/)
  assert.match(guideRoute, /<GuidanceTopicIcon topicKey=\{topic\.topicKey\} \/>/)
  assert.match(guideRoute, /class="breadcrumbs"/)
  assert.match(guideRoute, /class="topic-masthead"/)
  assert.match(guideRoute, /class="featured-lead"/)
  assert.match(guideRoute, /class="topic-guide-list"/)
  assert.match(guideRoute, /infoLabels\.backToHub/)
  assert.doesNotMatch(guideRoute, /min-height:\s*22rem/)
})

test('every stable public topic key maps to the shared outline icon registry and safe fallback', () => {
  for (const key of iconTopicKeys) {
    const keyPattern =
      key === 'housing' || key === 'other'
        ? new RegExp(`\\b${key}:\\s*\\[`)
        : new RegExp(`'${key}':\\s*\\[`)
    assert.match(icons, keyPattern)
  }
  assert.equal(
    (icons.match(/^  (?:'[^']+'|[a-z][\w-]*): \[/gm) ?? []).length,
    iconTopicKeys.length,
  )
  assert.match(icons, /const glyph = paths\[topicKey\] \?\? paths\.other/)
  assert.match(
    icons,
    /data-icon-fallback=\{paths\[topicKey\] \? undefined : 'document'\}/,
  )
  assert.match(icons, /viewBox="0 0 24 24"/)
  assert.match(icons, /width="22"\s+height="22"/)
  assert.match(icons, /fill="none"/)
  assert.match(icons, /stroke="currentColor"/)
  assert.match(icons, /stroke-width="1\.6"/)
  assert.match(icons, /stroke-linecap="round"/)
  assert.match(icons, /stroke-linejoin="round"/)
  assert.match(icons, /aria-hidden="true"/)
  assert.match(icons, /focusable="false"/)
})

test('Guidance hub and editorial labels are localized in ne and nb', () => {
  assert.match(
    ne,
    /searchPlaceholder: "खोज्नुहोस् \(जस्तै: BankID, skattekort, बसोबास अनुमति\)\.\.\."/,
  )
  assert.match(
    nb,
    /searchPlaceholder: "Søk \(for eksempel: BankID, skattekort, oppholdstillatelse\)\.\.\."/,
  )
  assert.match(ne, /topicHeading: "आफूलाई चाहिएको विषय छान्नुहोस्"/)
  assert.match(nb, /topicHeading: "Velg temaet du trenger"/)
  assert.match(
    ne,
    /topicGuideCount:\s*\{\s*one: "\{count\} प्रकाशित मार्गदर्शन",\s*other: "\{count\} प्रकाशित मार्गदर्शनहरू"/,
  )
  assert.match(
    nb,
    /topicGuideCount:\s*\{\s*one: "\{count\} publisert veiledning",\s*other: "\{count\} publiserte veiledninger"/,
  )
  assert.match(ne, /noPublishedTopicGuides: "अहिलेसम्म कुनै मार्गदर्शन प्रकाशित छैन"/)
  assert.match(nb, /noPublishedTopicGuides: "Ingen veiledninger er publisert ennå"/)
  for (const key of [
    'recentHeading',
    'featuredSpotlightLabel',
    'moreTopicsHeading',
    'viewTopicGuides',
    'quickJumpLabel',
    'recentJumpLabel',
    'backToHub',
    'topicsCountLabel',
    'guidesCountLabel',
  ]) {
    assert.match(ne, new RegExp(`\\b${key}:`))
    assert.match(nb, new RegExp(`\\b${key}:`))
  }
  assert.match(ne, /recentHeading:\s*"पछिल्ला तथा अद्यावधिक मार्गदर्शन"/)
  assert.match(ne, /recentJumpLabel:\s*"नयाँ"/)
  assert.doesNotMatch(ne, /\btopicsJumpLabel:/)
  assert.doesNotMatch(nb, /\btopicsJumpLabel:/)
  assert.match(masthead, /class="nav-recent"/)
  assert.match(masthead, /class="nav-recent-pill"/)
  assert.match(masthead, /class="nav-divider"/)
  assert.doesNotMatch(masthead, /topicsJumpLabel|#topics-heading/)
})

test('homepage selection and shared search scope remain independent of complete Guidance taxonomy', () => {
  assert.deepEqual(
    [...homepageTopics.matchAll(/'([^']+)',$/gm)].slice(0, 6).map((match) => match[1]),
    [
      'immigration-residence',
      'health-services',
      'work-employment',
      'family-children',
      'rights-safety-discrimination',
      'education-student-life',
    ],
  )
  assert.match(homepagePage, /<ContentSearch slot="search" language=\{language\} \/>/)
  assert.match(
    search,
    /guide\.title,[\s\S]*guide\.summary,[\s\S]*guide\.responsibleAgency,[\s\S]*\.\.\.\(guide\.searchKeywords \?\? \[\]\)/,
  )
  assert.match(queries, /export const ACTIVE_PUBLIC_INFORMATION_GUIDES_QUERY/)
  assert.match(queries, /export const PUBLIC_INFORMATION_TOPICS_BY_LANGUAGE_QUERY/)
  assert.doesNotMatch(
    queries.slice(
      queries.indexOf('export const ACTIVE_PUBLIC_INFORMATION_GUIDES_QUERY'),
      queries.indexOf('export const FEATURED_PUBLIC_INFORMATION_GUIDES_QUERY'),
    ),
    /_type == "(communityEvent|directoryListing|forum)/,
  )
})