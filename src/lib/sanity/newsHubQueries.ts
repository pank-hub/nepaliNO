import {publicNewsCategories} from '../newsHub'

const eligibleNews = `
  _type == "newsArticle" && language == $language &&
  !(_id in path("drafts.**")) && !(_id in path("versions.**")) &&
  defined(slug.current) && defined(publishedAt) && publishedAt <= now()
`
const storyProjection = `{
  _id, title, "slug": slug.current, language, summary, category, newsRegion,
  publishedAt, isFeatured,
  featuredImage {asset, alt, crop, hotspot}
}`
const newest = 'order(publishedAt desc, _id asc)'

export const NEWS_HUB_RECENT_QUERY = `*[${eligibleNews}] | ${newest} [0...24] ${storyProjection}`
export const NEWS_HUB_FEATURED_QUERY = `*[${eligibleNews} && isFeatured == true] | ${newest} [0] ${storyProjection}`
export const NEWS_HUB_CATEGORIES_QUERY = `{
  ${publicNewsCategories.map((category) =>
    `"${category}": *[${eligibleNews} && category == "${category}"] | ${newest} [0...18] ${storyProjection}`,
  ).join(',')}
}`
export const NEWS_HUB_COUNT_QUERY = `count(*[
  ${eligibleNews} && (!defined($category) || category == $category)
])`
export const NEWS_HUB_ARCHIVE_QUERY = `*[
  ${eligibleNews} && (!defined($category) || category == $category)
] | ${newest} [$start...$end] ${storyProjection}`

export const NEWS_HUB_GUIDES_QUERY = `*[
  _type == "publicInformationGuide" && language == $language &&
  !(_id in path("drafts.**")) && !(_id in path("versions.**")) &&
  defined(slug.current) && status == "active" &&
  defined(publishedAt) && publishedAt <= now()
] | order(publishedAt desc, _id asc) [0...6] {
  _id, title, "slug": slug.current, language, responsibleAgency
}`
