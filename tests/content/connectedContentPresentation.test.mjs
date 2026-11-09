import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import test from 'node:test'
import {homepageGuidanceTopicKeys, selectHomepageGuidanceTopics} from '../../src/config/homepage.ts'

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')
const [
  newsPage,
  guidePage,
  supportingCard,
  relatedNews,
  ne,
  nb,
  forumConfig,
  homepage,
  homepageEvents,
  homepageDirectory,
  homepageForum,
  homepageFeed,
  homepageEndpoint,
  forumContentEndpoint,
  forumCard,
] =
  await Promise.all([
    read('../../src/components/articles/NewsArticleView.astro'),
    read('../../src/components/articles/GuideView.astro'),
    read('../../src/components/content/SupportingGuideCard.astro'),
    read('../../src/components/content/RelatedNewsList.astro'),
    read('../../src/i18n/ne.ts'),
    read('../../src/i18n/nb.ts'),
    read('../../src/config/forum.ts'),
    read('../../src/pages/[lang]/index.astro'),
    read('../../src/components/home/HomeUpcomingEvents.astro'),
    read('../../src/components/home/HomeDirectoryHighlights.astro'),
    read('../../src/components/home/HomeForumActivity.astro'),
    read('../../src/lib/forum/loadHomepageForumTopics.ts'),
    read('../../src/pages/api/forum-homepage-discussions.ts'),
    read('../../src/pages/api/forum-content.ts'),
    read('../../src/components/content/ForumDiscussionCard.astro'),
  ])

test('News renders the supporting Guide only when the safe projection exists', () => {
  assert.match(newsPage, /article\.supportingGuide &&/)
  assert.match(newsPage, /<SupportingGuideCard/)
  assert.match(newsPage, /guide=\{article\.supportingGuide\}/)
})

test('Guide loads bounded reverse-related News and omits an empty module', () => {
  assert.match(guidePage, /RECENT_NEWS_FOR_GUIDE_QUERY/)
  assert.match(guidePage, /guideId: guide\._id/)
  assert.match(guidePage, /relatedNews\.length > 0/)
  assert.match(guidePage, /<RelatedNewsList/)
})

test('Guide renders editor-selected related Guides and omits an empty module', () => {
  assert.match(guidePage, /guide\.relatedGuides/)
  assert.match(guidePage, /relatedGuides\.length > 0/)
  assert.match(guidePage, /<RelatedGuidesList/)
})

test('connected-content titles are the compact internal links', () => {
  assert.match(supportingCard, /<h2>[\s\S]*<a href=\{`\/\$\{guide\.language\}\/info\/\$\{guide\.slug\}\/`\}>/)
  assert.match(relatedNews, /<a href=\{`\/\$\{article\.language\}\/news\/\$\{article\.slug\}\/`\}>\{article\.title\}<\/a>/)
  assert.doesNotMatch(supportingCard, /guide\.summary|reviewedDate|actionLabel/)
  assert.doesNotMatch(relatedNews, /article\.summary|publishedAt|actionLabel/)
  assert.doesNotMatch(supportingCard + relatedNews, /target="_blank"/)
})

test('both languages contain focused connected-content labels', () => {
  for (const source of [ne, nb]) {
    assert.match(source, /relatedNews:/)
    assert.match(source, /relatedGuides:/)
    assert.match(source, /readRelatedNews:/)
  }
})

test('homepage Forum feed and companion cards have separate feature controls', () => {
  assert.match(forumConfig, /contentIntegrationEnabled: true/)
  assert.match(forumConfig, /relatedTopicsEnabled: false/)
  assert.match(forumConfig, /homepageDiscussionFeedEnabled: true/)
  assert.match(newsPage + guidePage, /<ForumDiscussionCard/)
  assert.match(newsPage, /contentType="newsArticle"/)
  assert.match(guidePage, /contentType="publicInformationGuide"/)
  assert.match(homepage, /showForum && forumPilot\.homepageDiscussionFeedEnabled && <HomeForumActivity/)
  assert.match(homepageForum, /data-forum-topics/)
  assert.match(homepageForum, /api\/forum-homepage-discussions/)
  assert.doesNotMatch(homepage, /forumPilotAccess|forumInterfaceNotice/)
  assert.match(homepageFeed, /const MAX_TOPICS = 6/)
  assert.match(homepageFeed, /isHomepageDiscussionEligible/)
  assert.match(homepageEndpoint, /forumDiscussion\.topicId/)
  assert.match(homepageEndpoint, /forumQuestionsTopic\.topicId/)
  assert.match(
    forumContentEndpoint,
    /includeRelated: forumPilot\.relatedTopicsEnabled/,
  )
  assert.doesNotMatch(forumContentEndpoint, /related: metadata\.related/)
  assert.match(forumCard, /textContent/)
  assert.doesNotMatch(forumCard, /innerHTML|related/)
})

test('homepage Forum topics render as compact rows with inherited focus states', () => {
  assert.match(homepageForum, /<template data-forum-topic-template>/)
  assert.match(homepageForum, /class="forum-activity__row"/)
  assert.match(homepageForum, /<h3><a data-topic-link target="_blank" rel="noopener noreferrer"><\/a><\/h3>/)
  assert.match(homepageForum, /<dl>/)
  assert.match(homepageForum, /labels\.home\.forumReplies/)
  assert.match(homepageForum, /labels\.home\.forumNotice/)
  assert.match(homepageForum, /cloneNode\(true\)/)
  assert.match(homepageForum, /link\.textContent = topic\.title/)
  assert.match(homepageForum, /console\.warn\('Homepage Forum discussion feed is unavailable\.'/)
  assert.match(homepageForum, /grid-template-columns: repeat\(3,\s*minmax\(0,\s*1fr\)\)/)
  assert.match(homepageForum, /\.forum-activity__notice\s*\{[^}]*grid-column:\s*1 \/ -1;/)
  assert.doesNotMatch(homepageForum, /innerHTML|discussions__topic-card/)
})

test('homepage hero contains the unchanged search slot on a semantic surface without decoration', async () => {
  const [introduction, css] = await Promise.all([
    read('../../src/components/home/HomeIntroduction.astro'),
    read('../../src/styles/global.css'),
  ])
  assert.match(homepage, /<HomeIntroduction language=\{language\}>\s*<ContentSearch slot="search" language=\{language\} \/>\s*<\/HomeIntroduction>\s*<div class="container homepage">/)
  assert.match(introduction, /<header class="home-introduction">[\s\S]*<slot name="search" \/>[\s\S]*<\/header>/)
  assert.match(introduction, /background: var\(--surface-intro\)/)
  assert.match(css, /--surface-intro: linear-gradient\([^;]*var\(--surface-muted\)[^;]*var\(--color-warm-50\)/)
  assert.match(introduction, /border-block-end: 1px solid var\(--border\)/)
  assert.doesNotMatch(introduction, /<img|<svg|<picture|::before|::after|radial-gradient|animation:/)
  assert.match(introduction, /labels\.home\.title/)
  assert.match(introduction, /labels\.home\.introduction/)
})

test('homepage Guidance descriptions improve leading without changing editorial selection or links', async () => {
  const guidance = await read('../../src/components/home/HomeGuidanceTopics.astro')
  assert.match(guidance, /selectHomepageGuidanceTopics\(topics\)/)
  assert.match(guidance, /\{topic\.summary\}/)
  assert.match(guidance, /href=\{`\/\$\{language\}\/info\/topic\/\$\{topic\.slug\}\/`\}/)
  assert.match(guidance, /\.guidance-topic__summary\s*\{[^}]*font-size: 0\.9375rem;[^}]*font-weight: 400;[^}]*line-height: 1\.6;/)
  assert.match(guidance, /@media \(min-width: 44rem\)\s*\{\s*\.guidance-topic__summary\s*\{\s*line-height: 1\.55;/)
  assert.match(guidance, /-webkit-box-orient: vertical;\s*-webkit-line-clamp: 2;/)
  assert.doesNotMatch(guidance, /font-family:|\.slice\(|<script|height:\s*\d+px/)
})

test('homepage Forum hides relationship labels but preserves role data, links, metadata and failure hiding', () => {
  assert.doesNotMatch(homepageForum, /data-topic-role|forum-activity__role|forumNewsDiscussion|forumGuideDiscussion/)
  assert.match(homepageForum, /role: 'newsDiscussion' \| 'guideQuestions'/)
  assert.match(homepageForum, /topic\.role === 'newsDiscussion' \|\| topic\.role === 'guideQuestions'/)
  assert.match(homepageForum, /item\.dataset\.topicRole = topic\.role/)
  assert.match(homepageForum, /link\.href = topic\.url/)
  assert.match(homepageForum, /replies\.textContent = String\(topic\.replyCount\)/)
  assert.match(homepageForum, /time\.dateTime = date\.toISOString\(\)/)
  assert.match(homepageForum, /labels\.home\.forumUpdated/)
  assert.match(homepageForum, /<span aria-hidden="true">·<\/span>/)
  assert.match(homepageForum, /\.home-forum\s*\{[^}]*background: var\(--surface-muted\);[^}]*border: 1px solid var\(--border\);[^}]*border-radius: var\(--radius-md\);/)
  assert.match(homepageForum, /<p class="forum-activity__notice"><span>\{labels\.home\.forumNotice\}<\/span><\/p>/)
  assert.match(homepageForum, /\.forum-activity__notice\s*\{[^}]*border-block-start: 1px solid var\(--border\);[^}]*color: var\(--text-muted\);/)
  assert.match(homepageForum, /max-width: 75ch/)
  assert.match(homepageForum, /if \(topics\.length === 0\) return/)
  assert.match(homepageForum, /\.home-forum:has\(\[data-forum-topics\]\[hidden\]\)\s*\{\s*display: none;/)
  assert.match(homepageForum, /list\.append\(items\)\s*list\.hidden = false/)
  assert.doesNotMatch(homepageForum, /gradient|box-shadow|<svg/)
})

test('homepage omits empty Events and Directory sections and renders each real item only', () => {
  assert.match(homepage, /showEvents && homepageEvents\.length > 0 && \(\s*<HomeUpcomingEvents/)
  assert.match(homepage, /showDirectory && homepageDirectoryListings\.length > 0 && \(\s*<HomeDirectoryHighlights/)
  assert.match(homepage, /\(showEvents && homepageEvents\.length > 0\) \|\|[\s\S]*\(showDirectory && homepageDirectoryListings\.length > 0\)/)
  assert.match(homepage, /grid-template-columns:\s*minmax\(0,\s*1fr\)/)
  assert.match(homepageEvents, /events\.slice\(0,\s*3\)\.map\(\(event\) =>/)
  assert.match(homepageDirectory, /listings\.slice\(0,\s*3\)\.map\(\(listing\) =>/)
  assert.match(homepageEvents, /eventThumbnail\(event\.featuredImage\)/)
  assert.match(homepageEvents, /event\.featuredImage\?\.alt \?\? event\.title/)
  assert.match(homepageDirectory, /listing\.coverImage/)
  assert.match(homepageDirectory, /listing\.logo/)
  assert.match(homepageDirectory, /object-fit: contain/)
  assert.match(homepageEvents, /repeat\(auto-fit,\s*minmax\(min\(100%,\s*18rem\),\s*1fr\)\)/)
  assert.match(homepageDirectory, /repeat\(auto-fit,\s*minmax\(min\(100%,\s*18rem\),\s*1fr\)\)/)
  assert.doesNotMatch(homepageEvents, /emptyUpcomingMessage|events\.length === 0|events\.length > 0/)
  assert.doesNotMatch(homepageDirectory, /directory\.emptyMessage|listings\.length === 0|listings\.length > 0/)
  for (const component of [homepageEvents, homepageDirectory]) {
    assert.match(component, /border-radius: var\(--radius-md\)/)
  }
})

test('homepage Events render responsive thumbnails only for image-bearing items', () => {
  assert.match(homepageEvents, /events\.slice\(0,\s*3\)\.map\(\(event\) =>/)
  assert.match(homepageEvents, /eventThumbnail\(event\.featuredImage\)/)
  assert.match(homepageEvents, /if \(!image\?\.asset\) return null/)
  assert.match(homepageEvents, /\{image && \([\s\S]*?class="upcoming-events__media"[\s\S]*?<img/)
  assert.match(homepageEvents, /alt=\{event\.featuredImage\?\.alt \?\? event\.title\}/)
  assert.match(homepageEvents, /srcset=\{image\.srcset\}/)
  assert.match(homepageEvents, /width="320"\s+height="240"/)
  assert.match(homepageEvents, /\.upcoming-events__media\s*\{[^}]*aspect-ratio:\s*4 \/ 3;/)
  assert.match(homepageEvents, /Math\.min\(width,\s*nativeWidth\)/)
  assert.match(homepageEvents, /urlFor\(image\)\.width\(width\)\.height\(Math\.round\(width \* 3 \/ 4\)\)\.fit\('crop'\)/)
  assert.match(homepageEvents, /\.upcoming-events__media img\s*\{[^}]*width:\s*min\(100%,\s*var\(--media-native-width\)\)/)
  assert.match(homepageEvents, /grid-template-columns:\s*repeat\(auto-fit,\s*minmax\(min\(100%,\s*18rem\),\s*1fr\)\)/)
  assert.match(homepageEvents, /max-width:\s*36rem;/)
  assert.doesNotMatch(homepageEvents, /filter\([^)]*featuredImage|featuredImage[^}]*\?\s*events/)
})

test('homepage Directory renders photos, logos, and image-free listings independently', () => {
  assert.match(homepageDirectory, /listings\.slice\(0,\s*3\)\.map\(\(listing\) =>/)
  assert.match(homepageDirectory, /const hasCover = !!listing\.coverImage\?\.asset/)
  assert.match(homepageDirectory, /const sourceImage = hasCover \? listing\.coverImage : listing\.logo/)
  assert.match(homepageDirectory, /listingThumbnail\(sourceImage,\s*!hasCover\)/)
  assert.match(homepageDirectory, /if \(!image\?\.asset\) return null/)
  assert.match(homepageDirectory, /\{image && sourceImage && \([\s\S]*?<img/)
  assert.match(homepageDirectory, /alt=\{sourceImage\.alt \?\? listing\.name\}/)
  assert.match(homepageDirectory, /srcset=\{image\.srcset\}/)
  assert.match(homepageDirectory, /width="320"\s+height="240"/)
  assert.match(homepageDirectory, /\.directory-highlights__media\s*\{[^}]*aspect-ratio:\s*4 \/ 3;/)
  assert.match(homepageDirectory, /containsLogo\s*\?\s*builder\.fit\('max'\)/)
  assert.match(homepageDirectory, /\.directory-highlights__media--logo img\s*\{[^}]*object-fit:\s*contain;/)
  assert.match(homepageDirectory, /background:\s*var\(--surface\);/)
  assert.match(homepageDirectory, /Math\.min\(width,\s*nativeWidth\)/)
  assert.match(homepageDirectory, /urlFor\(image\)/)
  assert.match(homepageDirectory, /grid-template-columns:\s*repeat\(auto-fit,\s*minmax\(min\(100%,\s*18rem\),\s*1fr\)\)/)
  assert.match(homepageDirectory, /max-width:\s*36rem;/)
  assert.match(homepageDirectory, /<h3><a href=\{`\/\$\{language\}\/directory\/\$\{listing\.slug\}\/`\}>\{listing\.name\}<\/a><\/h3>/)
})

test('homepage Guidance selection uses exactly the requested stable keys in its own order', () => {
  const keys = [
    'immigration-residence',
    'health-services',
    'work-employment',
    'family-children',
    'rights-safety-discrimination',
    'education-student-life',
  ]
  assert.deepEqual([...homepageGuidanceTopicKeys], keys)
  const topics = [...keys].reverse().map((topicKey) => ({topicKey, title: 'Editorial title'}))
  const selected = selectHomepageGuidanceTopics(topics)
  assert.deepEqual(selected.map((topic) => topic.topicKey), keys)
  assert.ok(selected.every((topic) => topics.includes(topic)))
})

test('missing and ambiguous homepage topics are reported rather than replaced', (t) => {
  const warn = t.mock.method(console, 'warn', () => {})
  const topics = homepageGuidanceTopicKeys.slice(1).map((topicKey) => ({topicKey}))
  topics.push(topics[0])
  assert.equal(selectHomepageGuidanceTopics(topics).length, 4)
  assert.equal(warn.mock.calls.length, 2)
  assert.equal(warn.mock.calls[0].arguments[1].matchCount, 0)
  assert.equal(warn.mock.calls[1].arguments[1].matchCount, 2)
})

test('homepage previews are concise, navy-led and use mobile actions after the content', async () => {
  const [updates, guidance, headings, queries, header, introduction] = await Promise.all([
    read('../../src/components/home/HomeLatestUpdates.astro'),
    read('../../src/components/home/HomeGuidanceTopics.astro'),
    read('../../src/components/home/HomeSectionHeading.astro'),
    read('../../src/lib/sanity/queries.ts'),
    read('../../src/components/SiteHeader.astro'),
    read('../../src/components/home/HomeIntroduction.astro'),
  ])
  assert.match(updates, /featuredStory \? \[featuredStory, \.\.\.latestStories\] : latestStories\)\.slice\(0,\s*6\)/)
  assert.match(queries, /HOMEPAGE_LATEST_NEWS_BY_LANGUAGE_QUERY[\s\S]*?\[0\.\.\.6\]/)
  assert.match(queries, /HOMEPAGE_EVENTS_BY_LANGUAGE_QUERY[\s\S]*?featuredImage\s*\{[\s\S]*?alt,[\s\S]*?hotspot,[\s\S]*?crop/)
  assert.match(queries, /HOMEPAGE_DIRECTORY_LISTINGS_BY_LANGUAGE_QUERY[\s\S]*?logo\s*\{[\s\S]*?asset,[\s\S]*?alt,[\s\S]*?hotspot,[\s\S]*?crop[\s\S]*?coverImage\s*\{[\s\S]*?asset,[\s\S]*?alt,[\s\S]*?hotspot,[\s\S]*?crop/)
  assert.match(header, /justify-content: center;/)
  assert.match(header, /gap: 0\.35rem;/)
  assert.match(header, /border-block-end-color: var\(--brand\);/)
  assert.doesNotMatch(header, /\.desktop-navigation a\[aria-current="page"\]\s*\{[^}]*background:/)
  assert.match(introduction, /max-width: 34ch;/)
  assert.match(introduction, /\.home-introduction h1\s*\{[^}]*line-height: 1\.18;/)
  assert.match(introduction, /font-size: clamp\(2\.25rem, 2\.8vw, 2\.5rem\);/)
  assert.match(introduction, /max-width: 45rem;/)
  assert.doesNotMatch(updates, /article\.summary|article\.newsRegion|labels\.home\.featuredStory/)
  assert.match(updates, /thumbnail\(article\.featuredImage\)/)
  assert.match(updates, /urlFor\(image\)\.width\(width\)\.height\(/)
  assert.match(updates, /\.fit\('max'\)\.auto\('format'\)/)
  assert.match(updates, /Math\.min\(width, nativeWidth\)/)
  assert.match(updates, /srcset=\{image\.srcset\}/)
  assert.match(updates, /width="96"\s+height="72"/)
  assert.match(updates, /alt=\{article\.featuredImage\?\.alt \?\? ''\}/)
  assert.match(updates, /loading="lazy"/)
  assert.match(updates, /-webkit-line-clamp: 3/)
  assert.match(updates, /grid-template-columns: repeat\(3,\s*minmax\(0,\s*1fr\)\)/)
  assert.match(updates, /aria-label=\{article\.title\}/)
  assert.match(updates, /object-fit: cover/)
  assert.match(guidance, /selectHomepageGuidanceTopics\(topics\)/)
  assert.match(guidance, /data-icon-key=\{topic\.iconKey\}/)
  assert.match(guidance, /-webkit-line-clamp: 2/)
  assert.match(guidance, /aria-label=\{topic\.title\}/)
  assert.match(guidance, /<HomeGuidanceIcon topicKey=\{topic\.topicKey\}/)
  assert.doesNotMatch(guidance, /height: 100%|topic\.title ===/)
  for (const source of [updates, guidance, homepageEvents, homepageDirectory, homepageForum]) {
    assert.match(source, /color: var\(--text\)/)
    assert.match(source, /<\/HomeSectionHeading>/)
  }
  assert.doesNotMatch(homepageEvents, /event\.summary|class="badge|upcoming-events__submit/)
  assert.match(homepageEvents, /status && <p class="upcoming-events__status"/)
  assert.doesNotMatch(homepageDirectory, /listing\.summary|listing\.isFeatured|typeLabel|submitListing|class="badge/)
  assert.match(homepageDirectory, /listing\.isVerified &&/)
  assert.match(homepageForum, /\.home-forum:has\(\[data-forum-topics\]\[hidden\]\)/)
  assert.match(headings, /grid-template-areas: "heading" "content" "action"/)
  assert.match(headings, /<slot \/>[\s\S]*class="home-section__action"/)
  assert.match(headings, /@media \(min-width: 60rem\)/)
})

test('homepage Guidance icons share one decorative outline treatment and stable-key mapping', async () => {
  const icons = await read('../../src/components/home/HomeGuidanceIcon.astro')
  for (const key of homepageGuidanceTopicKeys) {
    assert.ok(icons.includes(`'${key}': [`))
  }
  assert.equal((icons.match(/': \[/g) ?? []).length, 6)
  assert.match(icons, /width="22"\s+height="22"/)
  assert.match(icons, /fill="none"/)
  assert.match(icons, /stroke="currentColor"/)
  assert.match(icons, /stroke-width="1\.6"/)
  assert.match(icons, /aria-hidden="true"/)
  assert.match(icons, /'health-services': \[[\s\S]*?'M6 5v4a6 6 0 0 0 12 0V5'/)
  assert.doesNotMatch(icons, /'health-services': \[[\s\S]*?'M12 3v18'/)
  assert.doesNotMatch(icons, /set:html|topic\.title|box-shadow|background:/)
  const updates = await read('../../src/components/home/HomeLatestUpdates.astro')
  assert.match(updates, /<span aria-hidden="true">·<\/span> \{formatDate\(article\.publishedAt\)\}/)
  assert.match(updates, /gap: 0\.3rem 0\.6rem;/)
})
