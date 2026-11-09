// Homepage-only selection using Sanity's stable topicKey; archive displayOrder is unchanged.
export const homepageGuidanceTopicKeys = [
  'immigration-residence',
  'health-services',
  'work-employment',
  'family-children',
  'rights-safety-discrimination',
  'education-student-life',
] as const

export function selectHomepageGuidanceTopics<T extends {topicKey: string}>(topics: readonly T[]): T[] {
  return homepageGuidanceTopicKeys.flatMap((topicKey) => {
    const matches = topics.filter((topic) => topic.topicKey === topicKey)
    if (matches.length !== 1) {
      console.warn('Homepage Guidance topic could not be uniquely resolved.', {
        topicKey,
        matchCount: matches.length,
      })
      return []
    }
    return matches
  })
}
