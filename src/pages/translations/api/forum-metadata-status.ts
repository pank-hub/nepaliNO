import type {APIRoute} from 'astro'
import {
  DiscourseMetadataConfigurationError,
  DiscourseMetadataRequestError,
  getDiscourseTopicMetadata,
} from '../../../lib/forum/discourseMetadata'
import {
  ForumContentMetadataUnavailableError,
  loadForumContentMetadata,
} from '../../../lib/forum/loadForumContentMetadata'
import {
  ForumContentRelationshipUnavailableError,
  resolveContentForumRelationships,
  type ForumContentIdentity,
} from '../../../lib/forum/resolveContentForumRelationships'
import {readTranslationSession} from '../../../lib/translationAuth/session'

export const prerender = false

const SYNTHETIC_CONTENT_IDENTITY = {
  contentType: 'newsArticle',
  language: 'nb',
  slug: 'syntetisk-test-forum-integrasjon',
} as const
const EXPECTED_SYNTHETIC_TOPIC_ID = 13

interface ResolverDiagnosticResult {
  name: string
  passed: boolean
}

const jsonResponse = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  })

const expectRelationshipUnavailable = async (
  name: string,
  identity: ForumContentIdentity,
): Promise<ResolverDiagnosticResult> => {
  try {
    await resolveContentForumRelationships(identity)
    return {name, passed: false}
  } catch (error) {
    return {
      name,
      passed: error instanceof ForumContentRelationshipUnavailableError,
    }
  }
}

const runResolverDiagnostics = async () => {
  const results = await Promise.all([
    expectRelationshipUnavailable(
      'future_dated_news_rejected_in_production_mode',
      SYNTHETIC_CONTENT_IDENTITY,
    ),
    expectRelationshipUnavailable('published_news_without_relationship_rejected', {
      contentType: 'newsArticle',
      language: 'nb',
      slug: 'den-nye-digitale-plattformen-nepali-no-er-i-testfasen',
    }),
    expectRelationshipUnavailable('active_guide_without_relationship_rejected', {
      contentType: 'publicInformationGuide',
      language: 'ne',
      slug: 'udi-oppholdstillatelse-offisiell-informasjon',
    }),
    expectRelationshipUnavailable('nonexistent_news_slug_rejected', {
      contentType: 'newsArticle',
      language: 'nb',
      slug: 'synthetic-nonexistent-forum-diagnostic',
    }),
    expectRelationshipUnavailable('wrong_language_identity_rejected', {
      contentType: 'newsArticle',
      language: 'ne',
      slug: 'den-nye-digitale-plattformen-nepali-no-er-i-testfasen',
    }),
  ])

  return results
}

export const GET: APIRoute = async ({cookies}) => {
  const session = await readTranslationSession(cookies)

  if (!session) {
    return jsonResponse(401, {
      ok: false,
      code: 'authentication_required',
      message: 'Sign in before checking Forum metadata connectivity.',
    })
  }

  try {
    const diagnostics = await runResolverDiagnostics()
    const failedDiagnostics = diagnostics.filter(({passed}) => !passed)

    if (failedDiagnostics.length > 0) {
      return jsonResponse(503, {
        ok: false,
        code: 'forum_resolver_diagnostics_failed',
        message: 'One or more protected Forum resolver diagnostics failed.',
        diagnostics,
      })
    }

    const resolved = await resolveContentForumRelationships(
      SYNTHETIC_CONTENT_IDENTITY,
      {
        mode: 'syntheticProbe',
        expectedTopicId: EXPECTED_SYNTHETIC_TOPIC_ID,
      },
    )
    const relationship = resolved.relationships[0]

    if (!relationship) {
      throw new ForumContentRelationshipUnavailableError(
        'The synthetic Forum relationship was not resolved.',
      )
    }

    const contentMetadata = await loadForumContentMetadata(
      resolved.relationships,
      getDiscourseTopicMetadata,
    )

    return jsonResponse(200, {
      ok: true,
      code: 'forum_response_shape_proven',
      message:
        'The protected Forum resolver diagnostics and final response shape are operational.',
      diagnostics,
      content: resolved.identity,
      companion: contentMetadata.companion,
      related: contentMetadata.related,
    })
  } catch (error) {
    console.error('Protected Forum resolver diagnostics failed', {
      errorName: error instanceof Error ? error.name : 'UnknownError',
      topicId: EXPECTED_SYNTHETIC_TOPIC_ID,
    })

    if (error instanceof DiscourseMetadataConfigurationError) {
      return jsonResponse(503, {
        ok: false,
        code: 'forum_metadata_not_configured',
        message: 'Forum metadata connectivity is not configured.',
      })
    }

    if (
      error instanceof DiscourseMetadataRequestError ||
      error instanceof ForumContentMetadataUnavailableError
    ) {
      return jsonResponse(503, {
        ok: false,
        code: 'forum_metadata_unavailable',
        message: 'Forum metadata could not be retrieved.',
      })
    }

    if (error instanceof ForumContentRelationshipUnavailableError) {
      return jsonResponse(503, {
        ok: false,
        code: 'forum_relationship_unavailable',
        message: 'The approved Sanity Forum relationship could not be verified.',
      })
    }

    return jsonResponse(500, {
      ok: false,
      code: 'forum_resolver_diagnostics_failed',
      message: 'The protected Forum resolver diagnostics failed.',
    })
  }
}

export const ALL: APIRoute = async () =>
  jsonResponse(405, {
    ok: false,
    code: 'method_not_allowed',
    message: 'Method not allowed.',
  })
