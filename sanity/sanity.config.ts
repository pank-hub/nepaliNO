import {visionTool} from '@sanity/vision'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {schemaTypes} from './schemaTypes'
import {submissionSchemaTypes} from './schemaTypes/submissionSchemaTypes'

export default defineConfig([
  {
    name: 'public-content',
    title: 'nepali.no Public Content',
    subtitle: 'Approved public editorial content',
    basePath: '/content',
    projectId: 'f9johco4',
    dataset: 'production',
    plugins: [
      structureTool({
        structure: (S) =>
          S.list()
            .title('Editorial workspace')
            .items([
              S.listItem()
                .title('News workspace')
                .child(
                  S.list()
                    .title('News workspace')
                    .items([
                      S.listItem()
                        .title('All News Articles')
                        .child(S.documentTypeList('newsArticle')),
                      S.divider(),
                      S.listItem()
                        .title('Drafts')
                        .child(
                          S.documentList()
                            .id('draft-news-articles')
                            .schemaType('newsArticle')
                            .filter('_type == "newsArticle" && _id in path("drafts.**")'),
                        ),
                      S.listItem()
                        .title('Scheduled stories')
                        .child(
                          S.documentList()
                            .id('scheduled-news-articles')
                            .schemaType('newsArticle')
                            .filter('_type == "newsArticle" && publishedAt > now()'),
                        ),
                      S.listItem()
                        .title('Featured stories')
                        .child(
                          S.documentList()
                            .id('featured-news-articles')
                            .schemaType('newsArticle')
                            .filter('_type == "newsArticle" && isFeatured == true'),
                        ),
                      S.listItem()
                        .title('Important Now')
                        .child(
                          S.documentList()
                            .id('important-news-articles')
                            .schemaType('newsArticle')
                            .filter('_type == "newsArticle" && isImportantNow == true'),
                        ),
                      S.divider(),
                      S.listItem()
                        .title('Nepali articles')
                        .child(
                          S.documentList()
                            .id('nepali-news-articles')
                            .schemaType('newsArticle')
                            .filter('_type == "newsArticle" && language == "ne"'),
                        ),
                      S.listItem()
                        .title('Norwegian articles')
                        .child(
                          S.documentList()
                            .id('norwegian-news-articles')
                            .schemaType('newsArticle')
                            .filter('_type == "newsArticle" && language == "nb"'),
                        ),
                      S.listItem()
                        .title('Missing translations')
                        .child(
                          S.documentList()
                            .id('missing-news-translations')
                            .schemaType('newsArticle')
                            .filter('_type == "newsArticle" && !defined(translation)'),
                        ),
                    ]),
                ),
              S.divider(),
              S.listItem()
                .title('Public Information Guides')
                .child(S.documentTypeList('publicInformationGuide')),
              S.listItem()
                .title('Public Information Topics')
                .child(S.documentTypeList('publicInformationTopic')),
              S.listItem().title('Community Events').child(S.documentTypeList('communityEvent')),
              S.listItem()
                .title('Directory Listings')
                .child(S.documentTypeList('directoryListing')),
              S.listItem().title('Trust Pages').child(S.documentTypeList('trustPage')),
              S.listItem().title('Norwegian Terms').child(S.documentTypeList('norwegianTerm')),
              S.divider(),
              S.listItem()
                .title('Forum Automation Records')
                .child(S.documentTypeList('forumCompanionAutomation')),
              S.listItem()
                .title('Forum Topic References')
                .child(S.documentTypeList('forumTopicReference')),
            ]),
      }),
      visionTool(),
    ],
    schema: {
      types: schemaTypes,
    },
  },
  {
    name: 'submission-moderation',
    title: 'nepali.no Submission Moderation',
    subtitle: 'Private Event and Community Directory submissions',
    basePath: '/event-moderation',
    projectId: 'f9johco4',
    dataset: 'submissions',
    plugins: [structureTool()],
    schema: {
      types: submissionSchemaTypes,
    },
    document: {
      actions: (previousActions, context) => {
        const privateSubmissionTypes = new Set(['eventSubmission', 'directoryListingSubmission'])

        if (!privateSubmissionTypes.has(context.schemaType)) {
          return previousActions
        }

        const blockedActions = new Set(['publish', 'unpublish', 'duplicate'])
        return previousActions.filter(
          (action) => !action.action || !blockedActions.has(action.action),
        )
      },
    },
  },
])
