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
    plugins: [structureTool(), visionTool()],
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
