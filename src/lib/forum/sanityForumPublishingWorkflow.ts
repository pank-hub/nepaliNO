import type {CompanionPublicationInput, PublishedCompanionTopic} from './discourseCompanionPublisher.ts'

export type ForumPublishingDocument = {
  _id: string
  _rev: string
  _type: 'newsArticle' | 'publicInformationGuide'
  title: string
  language: 'ne' | 'nb'
  slug: string
  publishedAt?: string
  status?: string
  forumCompanionAutomation?: {
    mode?: string
    status?: string
    attemptId?: string
  }
  forumDiscussion?: {topicId?: number}
  forumQuestionsTopic?: {topicId?: number}
}

export type ForumPublishingOutcome =
  | {code: 'published'; topicId: number; categoryId: number; topicUrl: string}
  | {code: 'already_linked'; topicId: number}
  | {code: 'not_automatic'}
  | {code: 'not_eligible'}
  | {code: 'creation_in_progress'}
  | {code: 'manual_reconciliation_required'}

export interface ForumPublishingDependencies {
  loadDocument: (documentId: string, documentType: ForumPublishingDocument['_type']) => Promise<ForumPublishingDocument | null>
  claimDocument: (document: ForumPublishingDocument, attemptId: string, now: string) => Promise<ForumPublishingDocument>
  publishTopic: (input: CompanionPublicationInput) => Promise<PublishedCompanionTopic>
  completeDocument: (document: ForumPublishingDocument, topic: PublishedCompanionTopic, now: string) => Promise<void>
  failDocument: (document: ForumPublishingDocument, code: string, now: string) => Promise<void>
  now?: () => Date
}

const readTopicId = (document: ForumPublishingDocument) =>
  document._type === 'newsArticle'
    ? document.forumDiscussion?.topicId
    : document.forumQuestionsTopic?.topicId

const isEligible = (document: ForumPublishingDocument, now: Date) => {
  if (document._type === 'newsArticle') {
    const publishedAt = document.publishedAt && new Date(document.publishedAt)
    return Boolean(publishedAt && !Number.isNaN(publishedAt.valueOf()) && publishedAt <= now)
  }
  return document.status === 'active'
}

const buildUrl = (document: ForumPublishingDocument) => {
  const section = document._type === 'newsArticle' ? 'news' : 'info'
  return `https://nepali.no/${document.language}/${section}/${document.slug}/`
}

export const runSanityForumPublishingWorkflow = async (
  identity: {documentId: string; documentType: ForumPublishingDocument['_type']; attemptId: string},
  dependencies: ForumPublishingDependencies,
): Promise<ForumPublishingOutcome> => {
  const now = (dependencies.now ?? (() => new Date()))()
  const document = await dependencies.loadDocument(identity.documentId, identity.documentType)
  if (!document) return {code: 'not_eligible'}

  const existingTopicId = readTopicId(document)
  if (Number.isInteger(existingTopicId) && (existingTopicId as number) > 0) {
    return {code: 'already_linked', topicId: existingTopicId as number}
  }

  if (document.forumCompanionAutomation?.mode !== 'automatic') return {code: 'not_automatic'}
  if (!isEligible(document, now)) return {code: 'not_eligible'}

  if (
    document.forumCompanionAutomation?.status === 'creating' ||
    document.forumCompanionAutomation?.status === 'created'
  ) {
    return document.forumCompanionAutomation.attemptId === identity.attemptId
      ? {code: 'creation_in_progress'}
      : {code: 'manual_reconciliation_required'}
  }

  const publicationInput: CompanionPublicationInput = {
    contentType: document._type,
    language: document.language,
    title: document.title,
    url: buildUrl(document),
  }
  const nowIso = now.toISOString()
  const claimed = await dependencies.claimDocument(document, identity.attemptId, nowIso)
  let topic: PublishedCompanionTopic

  try {
    topic = await dependencies.publishTopic(publicationInput)
  } catch {
    await dependencies.failDocument(
      claimed,
      'forum-publishing-result-unconfirmed',
      nowIso,
    )
    return {code: 'manual_reconciliation_required'}
  }

  try {
    await dependencies.completeDocument(claimed, topic, nowIso)
  } catch {
    return {code: 'manual_reconciliation_required'}
  }

  return {code: 'published', ...topic}
}
