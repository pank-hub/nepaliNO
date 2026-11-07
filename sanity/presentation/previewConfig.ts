import {defineDocuments, defineLocations, presentationTool} from 'sanity/presentation'

// Stable frontend origin used for draft preview. Must match PREVIEW_FRONTEND_ORIGIN in src/lib/preview/config.ts.
export const PRODUCTION_PREVIEW_ORIGIN = 'https://nepali.no'

// `sanity dev` only: the local Astro origin comes from SANITY_STUDIO_PREVIEW_ORIGIN in sanity/.env.local
// (e.g. the forwarded Codespaces URL). Production builds always use the stable production origin.
export const resolvePreviewOrigin = (nodeEnv?: string, devOrigin?: string): string => {
  if (nodeEnv !== 'development') return PRODUCTION_PREVIEW_ORIGIN
  const value = devOrigin?.trim()
  if (!value) {
    throw new Error(
      'SANITY_STUDIO_PREVIEW_ORIGIN is required in Studio development (e.g. http://localhost:4321). Add it to sanity/.env.local and restart Studio.',
    )
  }
  const url = new URL(value)
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('SANITY_STUDIO_PREVIEW_ORIGIN must be an http(s) origin.')
  }
  return url.origin
}

export const PREVIEW_ORIGIN =
  process.env.NODE_ENV === 'development'
    ? resolvePreviewOrigin('development', process.env.SANITY_STUDIO_PREVIEW_ORIGIN)
    : PRODUCTION_PREVIEW_ORIGIN

// Mirrors src/config/languageSections.ts: Public Information is Nepali-only in production, so
// Norwegian Guides have neither a preview nor a public location. Update both together.
const GUIDE_PREVIEW_LANGUAGES = ['ne']

// Published IDs only; drafts are addressed through the preview server's drafts perspective.
const publishedId = (id?: string) => (id ?? '').replace(/^drafts\./, '')

const newsLocations = defineLocations({
  select: {
    title: 'title',
    slug: 'slug.current',
    language: 'language',
    publishedAt: 'publishedAt',
    id: '_id',
  },
  resolve: (doc) => {
    const id = publishedId(doc?.id)
    const slug = doc?.slug
    const language = doc?.language
    const previewHref =
      slug && language ? `/preview/${language}/news/${slug}` : id ? `/preview/news/id/${id}` : null
    const isPublic =
      Boolean(slug && language && doc?.publishedAt) &&
      new Date(doc?.publishedAt as string).getTime() <= Date.now()

    return {
      locations: [
        ...(previewHref ? [{title: doc?.title || 'Untitled', href: previewHref}] : []),
        ...(isPublic ? [{title: 'Public page', href: `/${language}/news/${slug}/`}] : []),
      ],
    }
  },
})

const guideLocations = defineLocations({
  select: {
    title: 'title',
    slug: 'slug.current',
    language: 'language',
    status: 'status',
    id: '_id',
  },
  resolve: (doc) => {
    const id = publishedId(doc?.id)
    const slug = doc?.slug
    const language = doc?.language
    if (!language || !GUIDE_PREVIEW_LANGUAGES.includes(language)) return {locations: []}

    const previewHref = slug ? `/preview/${language}/info/${slug}` : id ? `/preview/info/id/${id}` : null
    const isPublic = Boolean(slug) && doc?.status === 'active'

    return {
      locations: [
        ...(previewHref ? [{title: doc?.title || 'Untitled', href: previewHref}] : []),
        ...(isPublic ? [{title: 'Public page', href: `/${language}/info/${slug}/`}] : []),
      ],
    }
  },
})

// Presentation belongs to the public-content workspace only; never add it to the moderation workspace.
export const createPresentationTool = () =>
  presentationTool({
    previewUrl: {
      origin: PREVIEW_ORIGIN,
      preview: '/preview/',
      previewMode: {
        enable: '/api/preview/enable',
        disable: '/api/preview/disable',
      },
    },
    resolve: {
      mainDocuments: defineDocuments([
        {
          route: '/preview/:lang/news/:slug',
          filter: '_type == "newsArticle" && slug.current == $slug && language == $lang',
        },
        {
          route: '/preview/news/id/:id',
          filter: '_type == "newsArticle" && _id in [$id, "drafts." + $id]',
        },
        {
          route: '/preview/:lang/info/:slug',
          filter: '_type == "publicInformationGuide" && slug.current == $slug && language == $lang',
        },
        {
          route: '/preview/info/id/:id',
          filter: '_type == "publicInformationGuide" && _id in [$id, "drafts." + $id]',
        },
      ]),
      locations: {
        newsArticle: newsLocations,
        publicInformationGuide: guideLocations,
      },
    },
  })
