import type {DiscourseTopicMetadata} from './discourseMetadata'
import {isForumTopicEligible} from './forumTopicEligibility.ts'
import type {
  ApprovedForumRelationship,
  ApprovedForumRelationshipRole,
} from './resolveContentForumRelationships'

export interface PublicForumTopicMetadata extends DiscourseTopicMetadata {
  role: ApprovedForumRelationshipRole
}

export interface PublicForumContentMetadata {
  companion: PublicForumTopicMetadata | null
  related: PublicForumTopicMetadata[]
}

export class ForumContentMetadataUnavailableError extends Error {}

export type ForumTopicMetadataLoader = (
  topicId: number,
) => Promise<DiscourseTopicMetadata>

const loadRelationship = async (
  relationship: ApprovedForumRelationship,
  loadTopicMetadata: ForumTopicMetadataLoader,
): Promise<PublicForumTopicMetadata | null> => {
  try {
    const metadata = await loadTopicMetadata(relationship.topicId)

    if (!isForumTopicEligible(metadata)) return null

    return {role: relationship.role, ...metadata}
  } catch {
    return null
  }
}

export const loadForumContentMetadata = async (
  relationships: ApprovedForumRelationship[],
  loadTopicMetadata: ForumTopicMetadataLoader,
): Promise<PublicForumContentMetadata> => {
  const companionRelationship = relationships.find(
    ({role}) => role !== 'related',
  )
  const relatedRelationships = relationships.filter(
    ({role}) => role === 'related',
  )

  const [companion, relatedResults] = await Promise.all([
    companionRelationship
      ? loadRelationship(companionRelationship, loadTopicMetadata)
      : Promise.resolve(null),
    Promise.all(
      relatedRelationships.map((relationship) =>
        loadRelationship(relationship, loadTopicMetadata),
      ),
    ),
  ])

  if (companionRelationship && !companion) {
    throw new ForumContentMetadataUnavailableError(
      'The companion Forum topic metadata is unavailable.',
    )
  }

  const related = relatedResults.filter(
    (metadata): metadata is PublicForumTopicMetadata => metadata !== null,
  )

  if (!companion && related.length === 0) {
    throw new ForumContentMetadataUnavailableError(
      'No approved Forum topic metadata is available.',
    )
  }

  return {companion, related}
}
