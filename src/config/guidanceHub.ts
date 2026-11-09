const priorityTopicKeys = [
  'immigration-residence',
  'health-services',
  'work-employment',
  'family-children',
  'rights-safety-discrimination',
  'housing',
  'education-student-life',
  'tax-finance',
] as const

const topicRanks = new Map<string, number>(
  priorityTopicKeys.map((key, index) => [key, index]),
)
topicRanks.set('other', priorityTopicKeys.length + 1)

// Stable sorting retains Sanity's relative order for all non-priority topics.
export function orderGuidanceHubTopics<T extends {topicKey: string}>(topics: readonly T[]): T[] {
  const rank = (topic: T) => topicRanks.get(topic.topicKey) ?? priorityTopicKeys.length
  return [...topics].sort((a, b) => rank(a) - rank(b))
}
