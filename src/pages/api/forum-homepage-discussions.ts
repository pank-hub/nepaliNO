import type {APIRoute} from 'astro'
import {sanityClient} from 'sanity:client'
import {forumPilot} from '../../config/forum'
import {getDiscourseTopicMetadata} from '../../lib/forum/discourseMetadata'
import {
  loadHomepageForumTopics,
  type HomepageForumTopicCandidate,
} from '../../lib/forum/loadHomepageForumTopics'

export const prerender = false

const candidatesQuery = `
  *[
    (
      _type == "newsArticle" &&
      language == $language &&
      defined(publishedAt) &&
      publishedAt <= now() &&
      defined(forumDiscussion.topicId)
    ) ||
    (
      _type == "publicInformationGuide" &&
      language == $language &&
      status == "active" &&
      defined(forumQuestionsTopic.topicId)
    )
  ] | order(publishedAt desc) [0...18] {
    "topicId": select(
      _type == "newsArticle" => forumDiscussion.topicId,
      forumQuestionsTopic.topicId
    ),
    "role": select(
      _type == "newsArticle" => "newsDiscussion",
      "guideQuestions"
    )
  }
`

const response = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control':
        status === 200
          ? 'public, max-age=0, s-maxage=60, stale-while-revalidate=300'
          : 'no-store',
      'x-content-type-options': 'nosniff',
    },
  })

export const GET: APIRoute = async ({url}) => {
  if (!forumPilot.homepageDiscussionFeedEnabled) {
    return response(404, {ok: false, code: 'not_found'})
  }

  const languages = url.searchParams.getAll('language')
  if (
    url.searchParams.size !== 1 ||
    languages.length !== 1 ||
    (languages[0] !== 'ne' && languages[0] !== 'nb')
  ) {
    return response(404, {ok: false, code: 'not_found'})
  }
  const language = languages[0]

  try {
    const candidates = await sanityClient.fetch<HomepageForumTopicCandidate[]>(
      candidatesQuery,
      {language},
    )
    const topics = await loadHomepageForumTopics(
      candidates,
      getDiscourseTopicMetadata,
    )

    return response(200, {ok: true, topics})
  } catch (error) {
    console.error('Homepage Forum discussion feed failed', {
      errorName: error instanceof Error ? error.name : 'UnknownError',
    })
    return response(503, {ok: false, code: 'forum_metadata_unavailable'})
  }
}

export const ALL: APIRoute = async () =>
  response(405, {ok: false, code: 'method_not_allowed'})
