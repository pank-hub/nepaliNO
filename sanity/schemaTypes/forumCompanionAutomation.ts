import {defineField, defineType} from 'sanity'

export const forumCompanionAutomation = defineType({
  name: 'forumCompanionAutomation',
  title: 'Forum Companion Automation',
  type: 'object',
  description:
    'Controls whether nepali.no should create a companion Forum topic after this content becomes eligible. Workflow status is managed by the server.',
  fields: [
    defineField({
      name: 'mode',
      title: 'Forum Companion Mode',
      type: 'string',
      description:
        'Choose no companion topic, automatic creation after eligible publication, or a manually linked existing topic.',
      options: {
        list: [
          {title: 'No Forum discussion', value: 'none'},
          {title: 'Create automatically when eligible', value: 'automatic'},
          {title: 'Link an existing topic manually', value: 'manual'},
        ],
        layout: 'radio',
      },
      initialValue: 'none',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'status',
      title: 'Automation Status',
      type: 'string',
      description:
        'Server-managed workflow status. Editors should not change this value.',
      options: {
        list: [
          {title: 'Not requested', value: 'not-requested'},
          {title: 'Pending', value: 'pending'},
          {title: 'Creating', value: 'creating'},
          {title: 'Created', value: 'created'},
          {title: 'Failed', value: 'failed'},
        ],
      },
      readOnly: true,
      initialValue: 'not-requested',
    }),
    defineField({
      name: 'lastAttemptAt',
      title: 'Last Attempt At',
      type: 'datetime',
      readOnly: true,
    }),
    defineField({
      name: 'completedAt',
      title: 'Completed At',
      type: 'datetime',
      readOnly: true,
    }),
    defineField({
      name: 'safeFailureCode',
      title: 'Safe Failure Code',
      type: 'string',
      description:
        'Non-sensitive server-managed code for operational follow-up. Credentials and raw provider errors must never be stored here.',
      readOnly: true,
      validation: (rule) => rule.max(120),
    }),
  ],
  preview: {
    select: {
      mode: 'mode',
      status: 'status',
    },
    prepare({mode, status}) {
      const modeLabels: Record<string, string> = {
        none: 'No Forum discussion',
        automatic: 'Automatic creation',
        manual: 'Manual topic link',
      }

      return {
        title: modeLabels[mode] || 'Forum companion not configured',
        subtitle: `Status: ${status || 'not-requested'}`,
      }
    },
  },
})
