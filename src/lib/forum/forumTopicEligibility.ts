import type {DiscourseTopicMetadata} from './discourseMetadata'
import type {ApprovedForumRelationshipRole} from './resolveContentForumRelationships'

export const newsDiscussionCategoryId = 10
export const guideQuestionsCategoryId = 11
export const relatedForumCategoryIds = [5, 6, 7, 8, 9] as const
export const homepageDiscussionCategoryIds = [10, 11] as const

const relatedForumCategoryIdSet = new Set<number>(relatedForumCategoryIds)

const isCategoryEligibleForRole = (
  categoryId: number,
  role: ApprovedForumRelationshipRole,
) => {
  if (role === 'newsDiscussion') return categoryId === newsDiscussionCategoryId
  if (role === 'guideQuestions') return categoryId === guideQuestionsCategoryId
  return relatedForumCategoryIdSet.has(categoryId)
}

export const isForumTopicEligible = (
  metadata: DiscourseTopicMetadata,
  role: ApprovedForumRelationshipRole,
): boolean =>
  metadata.archived === false &&
  Number.isInteger(metadata.categoryId) &&
  isCategoryEligibleForRole(metadata.categoryId as number, role)

export const isHomepageDiscussionEligible = (
  metadata: DiscourseTopicMetadata,
  role: Exclude<ApprovedForumRelationshipRole, 'related'>,
): boolean =>
  isForumTopicEligible(metadata, role) &&
  homepageDiscussionCategoryIds.includes(metadata.categoryId as 10 | 11)
