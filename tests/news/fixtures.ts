import {
  composeNewsFrontPage, publicNewsCategories, type NewsCategory, type NewsStory,
} from '../../src/lib/newsHub'
import type {NewsHubData} from '../../src/lib/sanity/loadNewsHub'

export function newsReviewFixture(imageFree = false, overlap = false): NewsHubData {
  const image = {
    asset: {_ref: 'image-5a0ba14f9d89f14227f46c9b118e817dc2ee6c81-1000x563-avif'},
    alt: 'Local News layout fixture',
    hotspot: {_type: 'sanity.imageHotspot' as const, x: .5, y: .5, width: 1, height: 1},
    crop: {_type: 'sanity.imageCrop' as const, top: 0, bottom: 0, left: 0, right: 0},
  }
  const story = (id: string, category: NewsCategory = 'current-affairs', index = 0): NewsStory => ({
    _id: id, slug: `review-${id}`, language: 'ne', category, newsRegion: 'norway',
    title: index % 2
      ? 'परीक्षण: नर्वेमा विद्यार्थी र परिवारका लागि सार्वजनिक सेवाको जानकारी'
      : 'परीक्षण: सार्वजनिक यातायात र दैनिक जीवनसम्बन्धी नयाँ जानकारी',
    summary: 'यो स्थानीय दृश्य परीक्षणका लागि मात्र तयार गरिएको सामग्री हो। कुनै समाचार वा सानिटी सामग्री परिवर्तन गरिएको छैन।',
    publishedAt: '2026-11-09T10:00:00Z',
    featuredImage: imageFree || index % 4 === 3 ? null : image,
  })
  const recent = Array.from({length: 24}, (_, index) => story(`recent-${index}`, 'current-affairs', index))
  const important = {...story('important'), importantUntil: '2099-01-01T10:00:00Z'}
  const categories = Object.fromEntries(publicNewsCategories.map((category) => [
    category, Array.from({length: category === 'economy-personal-finance' ? 2 : category === 'work-employment' ? 3 : category === 'immigration-integration' ? 4 : 6}, (_, i) => story(`${category}-${i}`, category, i)),
  ]))
  return {
    category: null, archive: false, count: 169, total: 15, stories: [],
    front: composeNewsFrontPage(recent, recent[0], overlap ? recent[0] : important, categories),
    guides: Array.from({length: 6}, (_, index) => ({
      _id: `guide-${index}`, slug: `review-guide-${index}`, language: 'ne' as const,
      title: 'परीक्षण: नर्वेमा सार्वजनिक सेवासम्बन्धी मार्गदर्शन',
      responsibleAgency: index % 2 ? 'NAV' : 'UDI',
    })),
  }
}
