import {defineField, defineType} from 'sanity'

import {
  ARTICLE_SUMMARY_MAX_ITEMS,
  validateArticleSummaryItem,
  validateArticleSummaryItems,
} from './articleSummaryValidation'

export const articleSummary = defineType({
  name: 'articleSummary',
  title: 'Article summary box',
  type: 'object',
  description:
    'Optional box with two to four key points near the top of the page. The heading, buttons and AI disclosure are added automatically in the page language.',
  fields: [
    defineField({
      name: 'enabled',
      title: 'Show the summary box',
      type: 'boolean',
      initialValue: false,
      description: 'Switch on only when the points below are finished and checked.',
    }),
    defineField({
      name: 'items',
      title: 'Summary points',
      type: 'array',
      of: [{type: 'string', validation: (rule) => rule.custom(validateArticleSummaryItem)}],
      options: {sortable: true},
      description: [
        'Two to four points. The first point is always visible; the others open with “Show more”.',
        'AI may help draft the points, but an editor must check every point against the article. The saved text is the approved published summary.',
        'Write one concise sentence per point. Do not add facts that are not in the article.',
      ].join(' '),
      validation: (rule) =>
        rule.max(ARTICLE_SUMMARY_MAX_ITEMS).custom((items, context) => {
          const parent = context.parent as {enabled?: boolean} | undefined
          return validateArticleSummaryItems(items, parent?.enabled)
        }),
    }),
    defineField({
      name: 'aiAssisted',
      title: 'Prepared with AI assistance',
      type: 'boolean',
      initialValue: true,
      description:
        'Turn this off if the summary was written entirely by an editor. When enabled, the public AI disclosure is displayed.',
    }),
  ],
  preview: {
    select: {enabled: 'enabled', items: 'items'},
    prepare({enabled, items}) {
      const count = Array.isArray(items) ? items.length : 0
      return {
        title: enabled ? 'Summary box: shown' : 'Summary box: hidden',
        subtitle: `${count} point${count === 1 ? '' : 's'}`,
      }
    },
  },
})
