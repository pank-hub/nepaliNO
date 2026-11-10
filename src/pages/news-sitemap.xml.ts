import {sanityClient} from 'sanity:client'
import {supportedLanguages} from '../i18n/config'
import {archiveTotalPages, newsPageUrl} from '../lib/newsHub'
import {NEWS_HUB_COUNT_QUERY} from '../lib/sanity/newsHubQueries'

// News hubs are request-rendered; explicitly retain their former sitemap coverage.
export const prerender = true
export async function GET() {
  const pages = await Promise.all(supportedLanguages.map(async (language) => {
    const count = await sanityClient.fetch<number>(
      NEWS_HUB_COUNT_QUERY, {language, category: null}, {perspective: 'published'},
    )
    return Array.from({length: archiveTotalPages(count, null)}, (_, index) =>
      `<url><loc>https://nepali.no${newsPageUrl(language, index + 1)}</loc></url>`,
    ).join('')
  }))
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages.join('')}</urlset>`,
    {headers: {'Content-Type': 'application/xml; charset=utf-8'}},
  )
}
