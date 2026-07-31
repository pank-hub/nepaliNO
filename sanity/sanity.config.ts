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
    name: 'event-moderation',
    title: 'nepali.no Event Moderation',
    subtitle: 'Private organizer submissions',
    basePath: '/event-moderation',
    projectId: 'f9johco4',
    dataset: 'submissions',
    plugins: [structureTool()],
    schema: {
      types: submissionSchemaTypes,
    },
    document: {
      actions: (previousActions, context) => {
        if (context.schemaType !== 'eventSubmission') {
          return previousActions
        }

        const blockedActions = new Set(['publish', 'unpublish', 'duplicate'])
        return previousActions.filter((action) => !action.action || !blockedActions.has(action.action))
      },
    },
  },
])
