import {forumPilot} from '../../config/forum'

const REQUEST_TIMEOUT_MS = 5_000

export class DiscourseMetadataConfigurationError extends Error {}
export class DiscourseMetadataRequestError extends Error {}

export interface DiscourseTopicMetadata {
  topicId: number
  title: string
  postsCount: number
  closed: boolean
  archived: boolean
  lastPostedAt?: string
  categoryId?: number
  tags: string[]
  url: string
}

const getRequiredEnvironmentVariable = (name: keyof ImportMetaEnv) => {
  const value = import.meta.env[name]?.trim()

  if (!value) {
    throw new DiscourseMetadataConfigurationError(
      `Missing required Forum metadata configuration: ${name}`,
    )
  }

  return value
}

const readNumber = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined

const readString = (value: unknown) =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined

const readStringArray = (value: unknown) =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : []

const buildTopicUrl = (topicId: number) =>
  new URL(`/t/${topicId}`, forumPilot.url).toString()

export const getDiscourseTopicMetadata = async (
  topicId: number,
): Promise<DiscourseTopicMetadata> => {
  if (!Number.isInteger(topicId) || topicId <= 0) {
    throw new TypeError('Discourse topic ID must be a positive integer.')
  }

  const apiKey = getRequiredEnvironmentVariable(
    'DISCOURSE_FORUM_METADATA_API_KEY',
  )
  const apiUsername = getRequiredEnvironmentVariable(
    'DISCOURSE_FORUM_METADATA_API_USERNAME',
  )
  const endpoint = new URL(`/t/${topicId}.json`, forumPilot.url)

  let response: Response

  try {
    response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'api-key': apiKey,
        'api-username': apiUsername,
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch (error) {
    throw new DiscourseMetadataRequestError(
      error instanceof Error && error.name === 'TimeoutError'
        ? 'The Forum metadata request timed out.'
        : 'The Forum metadata request failed.',
    )
  }

  if (!response.ok) {
    throw new DiscourseMetadataRequestError(
      `The Forum metadata request returned HTTP ${response.status}.`,
    )
  }

  let payload: unknown

  try {
    payload = await response.json()
  } catch {
    throw new DiscourseMetadataRequestError(
      'The Forum returned an invalid metadata response.',
    )
  }

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new DiscourseMetadataRequestError(
      'The Forum returned an invalid metadata object.',
    )
  }

  const topic = payload as Record<string, unknown>
  const returnedTopicId = readNumber(topic.id)
  const title = readString(topic.title)
  const postsCount = readNumber(topic.posts_count)

  if (
    returnedTopicId !== topicId ||
    !title ||
    postsCount === undefined ||
    !Number.isInteger(postsCount) ||
    postsCount < 1
  ) {
    throw new DiscourseMetadataRequestError(
      'The Forum response did not contain the required topic metadata.',
    )
  }

  return {
    topicId: returnedTopicId,
    title,
    postsCount,
    closed: topic.closed === true,
    archived: topic.archived === true,
    lastPostedAt: readString(topic.last_posted_at),
    categoryId: readNumber(topic.category_id),
    tags: readStringArray(topic.tags),
    url: buildTopicUrl(returnedTopicId),
  }
}
