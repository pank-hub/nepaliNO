import {defineField, defineType} from 'sanity'

export const norwegianTerm = defineType({
  name: 'norwegianTerm',
  title: 'Norwegian Term',
  type: 'document',
  fields: [
    defineField({
      name: 'term',
      title: 'Norwegian Term',
      type: 'string',
      description: 'Use the official Norwegian spelling.',
      validation: (rule) => rule.required().min(2).max(120),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'Stable internal identifier for this terminology entry.',
      options: {source: 'term', maxLength: 96},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'language',
      title: 'Explanation Language',
      type: 'string',
      options: {
        list: [
          {title: 'नेपाली', value: 'ne'},
          {title: 'Norsk bokmål', value: 'nb'},
        ],
        layout: 'radio',
      },
      initialValue: 'ne',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'translation',
      title: 'Translated Version',
      type: 'reference',
      description: 'Optional reference to the same term explained in the other language.',
      to: [{type: 'norwegianTerm'}],
      options: {
        filter: ({document}) => {
          if (document?.language === 'ne') {
            return {filter: 'language == $language', params: {language: 'nb'}}
          }

          if (document?.language === 'nb') {
            return {filter: 'language == $language', params: {language: 'ne'}}
          }

          return {}
        },
      },
      validation: (rule) =>
        rule.custom((translation, context) => {
          if (!translation?._ref) return true

          const currentId = context.document?._id?.replace(/^drafts\./, '')
          const translationId = translation._ref.replace(/^drafts\./, '')

          return currentId === translationId
            ? 'A terminology entry cannot reference itself as its translation.'
            : true
        }),
    }),
    defineField({
      name: 'pronunciation',
      title: 'Nepali Pronunciation',
      type: 'string',
      description: 'Optional pronunciation guidance in Devanagari. Do not add parentheses.',
      hidden: ({document}) => document?.language !== 'ne',
      validation: (rule) => rule.max(120),
    }),
    defineField({
      name: 'explanation',
      title: 'Explanation',
      type: 'text',
      rows: 5,
      description: 'Write the reusable explanation in the selected content language.',
      validation: (rule) => rule.required().min(20).max(1200),
    }),
    defineField({
      name: 'responsibleAuthority',
      title: 'Responsible Authority',
      type: 'string',
      description: 'Optional authority commonly responsible for this term, for example NAV or UDI.',
      validation: (rule) => rule.max(160),
    }),
    defineField({
      name: 'officialSourceUrl',
      title: 'Official Source URL',
      type: 'url',
      description: 'Optional official source used to verify the explanation.',
      validation: (rule) => rule.uri({scheme: ['https']}),
    }),
    defineField({
      name: 'searchAliases',
      title: 'Alternative Search Terms',
      type: 'array',
      description: 'Optional aliases that help editors find this entry.',
      of: [{type: 'string'}],
      validation: (rule) => rule.unique().max(12),
    }),
    defineField({
      name: 'lastReviewedAt',
      title: 'Last Reviewed At',
      type: 'date',
      description: 'The date on which the explanation and official source were last checked.',
      validation: (rule) => rule.required().max(new Date().toISOString().slice(0, 10)),
    }),
    defineField({
      name: 'isActive',
      title: 'Active Terminology Entry',
      type: 'boolean',
      description: 'Only active entries should be selected for new guides.',
      initialValue: true,
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {
      term: 'term',
      pronunciation: 'pronunciation',
      language: 'language',
      authority: 'responsibleAuthority',
      isActive: 'isActive',
    },
    prepare({term, pronunciation, language, authority, isActive}) {
      const displayedTerm = pronunciation ? `${term} (${pronunciation})` : term
      const status = isActive === false ? 'Inactive' : language === 'ne' ? 'Nepali' : 'Norwegian'
      const subtitle = authority ? `${status} · ${authority}` : status

      return {title: displayedTerm, subtitle}
    },
  },
  orderings: [
    {
      title: 'Norwegian term, A–Å',
      name: 'termAscending',
      by: [{field: 'term', direction: 'asc'}],
    },
    {
      title: 'Last reviewed, newest first',
      name: 'lastReviewedDescending',
      by: [{field: 'lastReviewedAt', direction: 'desc'}],
    },
  ],
})
