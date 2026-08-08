import type {DiscourseTopicMetadata} from './discourseMetadata'

export const publicForumCategoryIds = [5, 6, 7, 8, 9] as const

const publicForumCategoryIdSet = new Set<number>(publicForumCategoryIds)

export const isForumTopicEligible = (
  metadata: DiscourseTopicMetadata,
): boolean =>
  metadata.archived === false &&
  Number.isInteger(metadata.categoryId) &&
  publicForumCategoryIdSet.has(metadata.categoryId as number)
