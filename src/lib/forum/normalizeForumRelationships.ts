export const forumContentLanguages = ['ne', 'nb'] as const
export type ForumContentLanguage = (typeof forumContentLanguages)[number]

export type ApprovedForumRelationshipRole =
  | 'newsDiscussion'
  | 'guideQuestions'
  | 'related'

export interface ApprovedForumRelationship {
  role: ApprovedForumRelationshipRole
  topicId: number
}

export interface ForumTopicReferenceInput {
  topicId?: unknown
}

export interface ForumRelationshipsInput {
  companion?: ForumTopicReferenceInput | null
  related?: ForumTopicReferenceInput[] | null
}

export const isForumContentLanguage = (
  value: string,
): value is ForumContentLanguage =>
  forumContentLanguages.includes(value as ForumContentLanguage)

export const isValidForumContentSlug = (value: string) =>
  value.length >= 1 &&
  value.length <= 200 &&
  value === value.trim() &&
  /^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/u.test(value)

const readTopicId = (value: unknown) =>
  typeof value === 'number' && Number.isInteger(value) && value > 0
    ? value
    : undefined

export const normalizeForumRelationships = (
  document: ForumRelationshipsInput,
  companionRole: Exclude<ApprovedForumRelationshipRole, 'related'>,
): ApprovedForumRelationship[] => {
  const relationships: ApprovedForumRelationship[] = []
  const companionTopicId = readTopicId(document.companion?.topicId)

  if (companionTopicId !== undefined) {
    relationships.push({role: companionRole, topicId: companionTopicId})
  }

  const seenTopicIds = new Set<number>()
  if (companionTopicId !== undefined) seenTopicIds.add(companionTopicId)

  let relatedCount = 0
  for (const reference of document.related ?? []) {
    const topicId = readTopicId(reference?.topicId)
    if (topicId === undefined || seenTopicIds.has(topicId)) continue

    relationships.push({role: 'related', topicId})
    seenTopicIds.add(topicId)
    relatedCount += 1

    if (relatedCount === 3) break
  }

  return relationships
}
