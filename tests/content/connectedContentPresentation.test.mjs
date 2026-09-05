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
  homepageFeed,
  homepageEndpoint,
] =
  await Promise.all([
    read('../../src/pages/[lang]/news/[slug].astro'),
    read('../../src/pages/[lang]/info/[slug].astro'),
    read('../../src/components/content/SupportingGuideCard.astro'),
    read('../../src/components/content/RelatedNewsList.astro'),
    read('../../src/i18n/ne.ts'),
    read('../../src/i18n/nb.ts'),
    read('../../src/config/forum.ts'),
    read('../../src/pages/[lang]/index.astro'),
    read('../../src/lib/forum/loadHomepageForumTopics.ts'),
    read('../../src/pages/api/forum-homepage-discussions.ts'),
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
    assert.match(source, /readRelatedNews:/)
  }
})

test('homepage Forum feed is bounded and content-page Forum panels remain disabled', () => {
  assert.match(forumConfig, /contentIntegrationEnabled: false/)
  assert.match(forumConfig, /relatedTopicsEnabled: false/)
  assert.match(forumConfig, /homepageDiscussionFeedEnabled: true/)
  assert.doesNotMatch(newsPage + guidePage, /ForumDiscussionCard/)
  assert.match(homepage, /data-forum-topics/)
  assert.match(homepage, /api\/forum-homepage-discussions/)
  assert.doesNotMatch(homepage, /forumPilotAccess|forumInterfaceNotice/)
  assert.match(homepageFeed, /const MAX_TOPICS = 6/)
  assert.match(homepageFeed, /isHomepageDiscussionEligible/)
  assert.match(homepageEndpoint, /forumDiscussion\.topicId/)
  assert.match(homepageEndpoint, /forumQuestionsTopic\.topicId/)
})
