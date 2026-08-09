import {createClient} from '@sanity/client'
import type {PublishedCompanionTopic} from './discourseCompanionPublisher.ts'
import type {ForumPublishingDependencies, ForumPublishingDocument} from './sanityForumPublishingWorkflow.ts'

const PROJECT_ID = 'f9johco4'
const DATASET = 'production'
const API_VERSION = '2026-08-09'

export class SanityForumAutomationConfigurationError extends Error {}

const getClient = () => {
  const token = import.meta.env.SANITY_FORUM_AUTOMATION_TOKEN?.trim()
  if (!token) throw new SanityForumAutomationConfigurationError('Forum automation is not configured.')
  return createClient({projectId: PROJECT_ID, dataset: DATASET, apiVersion: API_VERSION, token, useCdn: false, perspective: 'published'})
}

const projection = `{
  _id, _rev, _type, title, language, "slug": slug.current, publishedAt, status,
  forumCompanionAutomation {mode, status, attemptId},
  forumDiscussion {topicId}, forumQuestionsTopic {topicId}
}`

export const createSanityForumPublishingDependencies = (
  publishTopic: ForumPublishingDependencies['publishTopic'],
): ForumPublishingDependencies => {
  const client = getClient()
  return {
    publishTopic,
    loadDocument: (documentId, documentType) => client.fetch<ForumPublishingDocument | null>(
      `*[_id == $documentId && _type == $documentType][0] ${projection}`,
      {documentId, documentType},
    ),
    claimDocument: async (document, attemptId, now) => client
      .patch(document._id)
      .set({
        'forumCompanionAutomation.status': 'creating',
        'forumCompanionAutomation.attemptId': attemptId,
        'forumCompanionAutomation.lastAttemptAt': now,
      })
      .unset(['forumCompanionAutomation.safeFailureCode'])
      .ifRevisionId(document._rev)
      .commit<ForumPublishingDocument>({returnFirst: true, returnDocuments: true}),
    completeDocument: async (document, topic: PublishedCompanionTopic, now) => {
      const relationshipPath = document._type === 'newsArticle' ? 'forumDiscussion' : 'forumQuestionsTopic'
      await client.patch(document._id)
        .set({
          [relationshipPath]: {
            _type: 'forumTopicReference',
            topicId: topic.topicId,
            editorialLabel: document.title,
          },
          'forumCompanionAutomation.status': 'created',
          'forumCompanionAutomation.completedAt': now,
        })
        .unset(['forumCompanionAutomation.safeFailureCode'])
        .ifRevisionId(document._rev)
        .commit()
    },
    failDocument: async (document, code, now) => {
      await client.patch(document._id)
        .set({
          'forumCompanionAutomation.status': 'failed',
          'forumCompanionAutomation.lastAttemptAt': now,
          'forumCompanionAutomation.safeFailureCode': code,
        })
        .ifRevisionId(document._rev)
        .commit()
    },
  }
}
