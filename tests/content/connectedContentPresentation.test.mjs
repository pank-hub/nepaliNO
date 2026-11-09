import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import test from 'node:test'

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
  assert.doesNotMatch(homepageForum, /innerHTML|discussions__topic-card|grid-template-columns/)
})

test('homepage omits empty Events and Directory sections and renders each real item only', () => {
  assert.match(homepage, /showEvents && homepageEvents\.length > 0 && \(\s*<HomeUpcomingEvents/)
  assert.match(homepage, /showDirectory && homepageDirectoryListings\.length > 0 && \(\s*<HomeDirectoryHighlights/)
  assert.match(homepage, /\(showEvents && homepageEvents\.length > 0\) \|\|[\s\S]*\(showDirectory && homepageDirectoryListings\.length > 0\)/)
  assert.match(homepageEvents, /events\.map\(\(event\) =>/)
  assert.match(homepageDirectory, /listings\.map\(\(listing\) =>/)
  assert.doesNotMatch(homepageEvents, /emptyUpcomingMessage|events\.length === 0|events\.length > 0/)
  assert.doesNotMatch(homepageDirectory, /directory\.emptyMessage|listings\.length === 0|listings\.length > 0/)
  for (const component of [homepageEvents, homepageDirectory]) {
    assert.doesNotMatch(component, /repeat\(\s*3|grid-template-columns|grid-column|:has\(/)
    assert.match(component, /<style>/)
  }
})
