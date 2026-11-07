// Server-only preview loader core. The Sanity client is injected so this module has no virtual
// imports and can be tested; `loader.ts` binds the real client and environment.
import {isSectionEnabled} from '../../config/languageSections.ts'
import {
  NEWS_ARTICLE_PREVIEW_BY_ID_QUERY,
  NEWS_ARTICLE_PREVIEW_BY_SLUG_QUERY,
  PUBLIC_INFORMATION_GUIDE_PREVIEW_BY_ID_QUERY,
  PUBLIC_INFORMATION_GUIDE_PREVIEW_BY_SLUG_QUERY,
} from '../sanity/queries.ts'
import {
  PREVIEW_STUDIO_URL,
  getPreviewConfig,
  parsePreviewDocumentId,
  parsePreviewLanguage,
  parsePreviewSlug,
  verifyPreviewCookieValue,
  type PreviewEnv,
  type PreviewLanguage,
} from './config.ts'

export type PreviewKind = 'news' | 'guide'

export type PreviewSelector =
  | {kind: PreviewKind; language: unknown; slug: unknown}
  | {kind: PreviewKind; id: unknown}

// Fixed queries only. Nothing in this table comes from a request.
const QUERIES = {
  news: {slug: NEWS_ARTICLE_PREVIEW_BY_SLUG_QUERY, id: NEWS_ARTICLE_PREVIEW_BY_ID_QUERY},
  guide: {
    slug: PUBLIC_INFORMATION_GUIDE_PREVIEW_BY_SLUG_QUERY,
    id: PUBLIC_INFORMATION_GUIDE_PREVIEW_BY_ID_QUERY,
  },
} as const

export interface PreviewClientLike {
  withConfig(config: Record<string, unknown>): PreviewClientLike
  fetch(
    query: string,
    params: Record<string, unknown>,
    options: Record<string, unknown>,
  ): Promise<unknown>
}

export type PreviewResult<T> =
  | {status: 'inactive'}
  | {status: 'not-found'}
  | {status: 'ok'; data: T; language: PreviewLanguage}

interface StegaFilterProps {
  sourcePath: (string | number | {_key?: string})[]
}

// Stega is limited to text that is only ever rendered as body copy, title and summary. Values used
// for lookups, dates, URLs and labels stay clean so the shared views behave exactly as in production.
export function shouldEncodeStega({sourcePath}: StegaFilterProps): boolean {
  const last = sourcePath[sourcePath.length - 1]
  if (sourcePath.length === 1) return last === 'title' || last === 'summary'
  return sourcePath[0] === 'body' && sourcePath.includes('children') && last === 'text'
}

export function createPreviewClient(client: PreviewClientLike, token: string): PreviewClientLike {
  return client.withConfig({
    token,
    useCdn: false,
    perspective: 'drafts',
    resultSourceMap: 'withKeyArraySelector',
    stega: {enabled: true, studioUrl: PREVIEW_STUDIO_URL, filter: shouldEncodeStega},
  })
}

export interface PreviewLoaderDeps {
  client: PreviewClientLike
  env: PreviewEnv | undefined
  cookieValue: string | undefined
  nowSeconds?: number
}

export async function loadPreviewDocument<T extends {language?: string}>(
  deps: PreviewLoaderDeps,
  selector: PreviewSelector,
): Promise<PreviewResult<T>> {
  const config = getPreviewConfig(deps.env)
  if (!config) return {status: 'inactive'}

  if (!(await verifyPreviewCookieValue(config.cookieSecret, deps.cookieValue, deps.nowSeconds))) {
    return {status: 'inactive'}
  }

  let query: string
  let params: Record<string, unknown>

  if ('id' in selector) {
    const id = parsePreviewDocumentId(selector.id)
    if (!id) return {status: 'not-found'}
    query = QUERIES[selector.kind]?.id
    params = {id}
  } else {
    const language = parsePreviewLanguage(selector.language)
    const slug = parsePreviewSlug(selector.slug)
    if (!language || !slug) return {status: 'not-found'}
    query = QUERIES[selector.kind]?.slug
    params = {language, slug}
  }

  if (!query) return {status: 'not-found'}

  let document: T | null
  try {
    const response = (await createPreviewClient(deps.client, config.token).fetch(query, params, {
      filterResponse: false,
      perspective: 'drafts',
      useCdn: false,
    })) as {result?: T | null}
    document = response?.result ?? null
  } catch {
    // Includes a revoked or expired token. Never surface the upstream error or token.
    return {status: 'not-found'}
  }

  const language = parsePreviewLanguage(document?.language)
  if (!document || !language) return {status: 'not-found'}

  // Preview must not reveal content for a section that production keeps disabled.
  if (selector.kind === 'guide' && !isSectionEnabled(language, 'information')) {
    return {status: 'not-found'}
  }

  return {status: 'ok', data: document, language}
}
