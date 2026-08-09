import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import test from 'node:test'

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')
const [newsPage, guidePage, supportingCard, relatedNews, ne, nb, forumConfig, homepage] =
  await Promise.all([
    read('../../src/pages/[lang]/news/[slug].astro'),
    read('../../src/pages/[lang]/info/[slug].astro'),
    read('../../src/components/content/SupportingGuideCard.astro'),
    read('../../src/components/content/RelatedNewsList.astro'),
    read('../../src/i18n/ne.ts'),
    read('../../src/i18n/nb.ts'),
    read('../../src/config/forum.ts'),
    read('../../src/pages/[lang]/index.astro'),
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

test('connected-content cards use internal localized content routes', () => {
  assert.match(supportingCard, /\/info\/\$\{guide\.slug\}\//)
  assert.match(relatedNews, /\/news\/\$\{article\.slug\}\//)
  assert.doesNotMatch(supportingCard + relatedNews, /target="_blank"/)
})

test('both languages contain focused connected-content labels', () => {
  for (const source of [ne, nb]) {
    assert.match(source, /relatedNews:/)
    assert.match(source, /readRelatedNews:/)
  }
})

test('Forum presentation and homepage remain untouched and disabled', () => {
  assert.match(forumConfig, /contentIntegrationEnabled: false/)
  assert.match(forumConfig, /relatedTopicsEnabled: false/)
  assert.doesNotMatch(newsPage + guidePage, /ForumDiscussionCard/)
  assert.match(homepage, /class="discussions__pilot"/)
})
