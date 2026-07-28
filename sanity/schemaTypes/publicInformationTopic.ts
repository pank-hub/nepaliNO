import {defineField, defineType} from 'sanity'

const topicOptions = [
  {title: 'Immigration and Residence', value: 'immigration-residence'},
  {title: 'Work and Employment', value: 'work-employment'},
  {title: 'Tax and Personal Finance', value: 'tax-finance'},
  {
    title: 'Moving and Population Register',
    value: 'moving-population-register',
  },
  {title: 'Education and Student Life', value: 'education-student-life'},
  {title: 'Health Services', value: 'health-services'},
  {title: 'Family and Children', value: 'family-children'},
  {title: 'Housing', value: 'housing'},
  {
    title: 'Norwegian Language and Integration',
    value: 'language-integration',
  },
  {
    title: 'Digital Public Services and e-ID',
    value: 'digital-services-eid',
  },
  {
    title: 'Citizenship and Civic Participation',
    value: 'citizenship-participation',
  },
  {
    title: 'Rights, Safety, and Discrimination',
    value: 'rights-safety-discrimination',
  },
  {title: 'Other Useful Information', value: 'other'},
]

export const publicInformationTopic = defineType({
  name: 'publicInformationTopic',
  title: 'Public Information Topic',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Public Title',
      type: 'string',
      description: 'Write the topic title in the selected content language.',
      validation: (rule) => rule.required().min(3).max(100),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'The language-specific URL identifier for this topic hub.',
      options: {
        source: 'title',
        maxLength: 80,
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'language',
      title: 'Content Language',
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
      description:
        'Optional reference to the corresponding topic hub in the other language.',
      to: [{type: 'publicInformationTopic'}],
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
            ? 'A topic hub cannot reference itself as its translation.'
            : true
        }),
    }),
    defineField({
      name: 'topicKey',
      title: 'Topic Key',
      type: 'string',
      description:
        'Stable internal key. It must match the Topic value used by Public Information Guides.',
      options: {
        list: topicOptions,
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'text',
      rows: 3,
      description: 'Short introduction used on the Public Information homepage.',
      validation: (rule) => rule.required().min(40).max(300),
    }),
    defineField({
      name: 'introduction',
      title: 'Topic Introduction',
      type: 'array',
      description: 'Optional introduction shown at the top of the topic hub.',
      of: [{type: 'block'}],
    }),
    defineField({
      name: 'displayOrder',
      title: 'Display Order',
      type: 'number',
      description: 'Lower numbers appear first. Use increments such as 10, 20, and 30.',
      initialValue: 100,
      validation: (rule) => rule.required().integer().min(0).max(10000),
    }),
    defineField({
      name: 'iconKey',
      title: 'Icon Key',
      type: 'string',
      description:
        'Optional stable icon identifier for the frontend. Leave empty until an icon is assigned.',
      validation: (rule) => rule.max(60),
    }),
    defineField({
      name: 'featuredGuides',
      title: 'Featured Guides',
      type: 'array',
      description:
        'Optional editorial selection of important starting guides for this topic.',
      of: [
        {
          type: 'reference',
          to: [{type: 'publicInformationGuide'}],
          options: {
            filter: ({document}) => {
              if (!document?.language || !document?.topicKey) return {}
              return {
                filter: 'language == $language && topic == $topicKey',
                params: {
                  language: document.language,
                  topicKey: document.topicKey,
                },
              }
            },
          },
        },
      ],
      validation: (rule) => rule.unique().max(6),
    }),
    defineField({
      name: 'seoDescription',
      title: 'SEO Description',
      type: 'text',
      rows: 3,
      description:
        'Optional search description. If empty, the public Summary can be used.',
      validation: (rule) => rule.max(170),
    }),
    defineField({
      name: 'isActive',
      title: 'Active Topic Hub',
      type: 'boolean',
      description: 'Only active topic hubs should appear on the public website.',
      initialValue: false,
    }),
  ],
  orderings: [
    {
      title: 'Display order',
      name: 'displayOrderAsc',
      by: [
        {field: 'displayOrder', direction: 'asc'},
        {field: 'title', direction: 'asc'},
      ],
    },
    {
      title: 'Title',
      name: 'titleAsc',
      by: [{field: 'title', direction: 'asc'}],
    },
  ],
  preview: {
    select: {
      title: 'title',
      language: 'language',
      topicKey: 'topicKey',
      isActive: 'isActive',
      displayOrder: 'displayOrder',
    },
    prepare({title, language, topicKey, isActive, displayOrder}) {
      const languageLabel = language === 'nb' ? 'Norsk' : 'नेपाली'
      const statusLabel = isActive ? 'ACTIVE' : 'DRAFT'
      return {
        title,
        subtitle: `${languageLabel} · ${topicKey || 'No topic key'} · ${statusLabel} · Order ${displayOrder ?? 100}`,
      }
    },
  },
})
