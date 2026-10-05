import {
  DiscourseMetadataConfigurationError,
  DiscourseMetadataRequestError,
  DiscourseMetadataResponseError,
  type DiscourseTopicMetadata,
} from './discourseMetadata.ts'
import {isHomepageDiscussionEligible} from './forumTopicEligibility.ts'
import type {ApprovedForumRelationshipRole} from './resolveContentForumRelationships.ts'

const MAX_CANDIDATES = 18
const MAX_TOPICS = 6
const CONCURRENCY = 3

type HomepageTopicRole = Exclude<ApprovedForumRelationshipRole, 'related'>

export interface HomepageForumTopicCandidate {
  topicId: number
  role: HomepageTopicRole
}

export interface HomepageForumTopic extends DiscourseTopicMetadata {
  role: HomepageTopicRole
}

export type HomepageForumTopicLoader = (
  topicId: number,
) => Promise<DiscourseTopicMetadata>

const activityTimestamp = (topic: HomepageForumTopic) => {
  const value = topic.lastPostedAt ? Date.parse(topic.lastPostedAt) : Number.NaN
  return Number.isFinite(value) ? value : 0
}

export const loadHomepageForumTopics = async (
  candidates: HomepageForumTopicCandidate[],
  loadTopicMetadata: HomepageForumTopicLoader,
): Promise<HomepageForumTopic[]> => {
  const uniqueCandidates: HomepageForumTopicCandidate[] = []
  const seenTopicIds = new Set<number>()

  for (const candidate of candidates) {
    if (
      !Number.isInteger(candidate.topicId) ||
      candidate.topicId <= 0 ||
      seenTopicIds.has(candidate.topicId)
    ) {
      continue
    }

    uniqueCandidates.push(candidate)
    seenTopicIds.add(candidate.topicId)

    if (uniqueCandidates.length === MAX_CANDIDATES) break
  }

  const results: PromiseSettledResult<HomepageForumTopic | null>[] = []

  // Small batches keep Discourse from rate limiting (HTTP 429) the whole feed.
  for (let index = 0; index < uniqueCandidates.length; index += CONCURRENCY) {
    const batch = await Promise.allSettled(
      uniqueCandidates.slice(index, index + CONCURRENCY).map(async (candidate) => {
        const metadata = await loadTopicMetadata(candidate.topicId)
        return isHomepageDiscussionEligible(metadata, candidate.role)
          ? {...metadata, role: candidate.role}
          : null
      }),
    )
    results.push(...batch)
  }

  const isServiceFailure = (result: PromiseSettledResult<unknown>) =>
    result.status === 'rejected' &&
    (result.reason instanceof DiscourseMetadataConfigurationError ||
      result.reason instanceof DiscourseMetadataRequestError ||
      result.reason instanceof DiscourseMetadataResponseError)

  // Show the topics that loaded; only fail when nothing could be loaded.
  const loadedAny = results.some((result) => result.status === 'fulfilled')
  const serviceFailure = results.find(isServiceFailure)
  if (!loadedAny && serviceFailure?.status === 'rejected') {
    throw serviceFailure.reason
  }

  return results
    .flatMap((result) =>
      result.status === 'fulfilled' && result.value ? [result.value] : [],
    )
    .sort((first, second) => activityTimestamp(second) - activityTimestamp(first))
    .slice(0, MAX_TOPICS)
}
