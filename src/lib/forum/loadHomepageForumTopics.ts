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

  const results = await Promise.allSettled(
    uniqueCandidates.map(async (candidate) => {
      const metadata = await loadTopicMetadata(candidate.topicId)
      return isHomepageDiscussionEligible(metadata, candidate.role)
        ? {...metadata, role: candidate.role}
        : null
    }),
  )

  const configurationFailure = results.find(
    (result) =>
      result.status === 'rejected' &&
      (result.reason instanceof DiscourseMetadataConfigurationError ||
        result.reason instanceof DiscourseMetadataRequestError ||
        result.reason instanceof DiscourseMetadataResponseError),
  )
  if (configurationFailure?.status === 'rejected') {
    throw configurationFailure.reason
  }

  return results
    .flatMap((result) =>
      result.status === 'fulfilled' && result.value ? [result.value] : [],
    )
    .sort((first, second) => activityTimestamp(second) - activityTimestamp(first))
    .slice(0, MAX_TOPICS)
}
