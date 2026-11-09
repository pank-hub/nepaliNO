import type {APIRoute} from 'astro'
import {sanityClient} from 'sanity:client'
import {isSectionEnabled} from '../../config/languageSections'
import {supportedLanguages, isSupportedLanguage} from '../../i18n/config'
import {buildSearchIndex, serializeSearchIndex, type SearchSourceDocument} from '../../lib/search/buildIndex'
import {SHARED_SEARCH_QUERY} from '../../lib/search/query'

export const prerender = true
export const getStaticPaths = () => supportedLanguages.map((lang) => ({params: {lang}}))

export const GET: APIRoute = async ({params}) => {
  if (!isSupportedLanguage(params.lang)) return new Response(null, {status: 404})
  const language = params.lang
  // A failed source query fails deployment rather than publishing an empty/partial index.
  const sources = await sanityClient.fetch<SearchSourceDocument[]>(SHARED_SEARCH_QUERY, {
    language,
    guidance: isSectionEnabled(language, 'information'),
    directory: isSectionEnabled(language, 'directory'),
  }, {perspective: 'published', useCdn: false})
  return new Response(JSON.stringify(serializeSearchIndex(buildSearchIndex(sources, language))), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=0, must-revalidate',
      'x-content-type-options': 'nosniff',
    },
  })
}
