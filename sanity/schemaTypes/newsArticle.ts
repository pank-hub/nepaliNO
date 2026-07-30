import {defineArrayMember, defineField, defineType} from 'sanity'

export const newsArticle = defineType({
  name: 'newsArticle',
  title: 'News Article',
  type: 'document',

  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'The main headline written in the selected content language.',
      validation: (rule) =>
        rule.required().min(10).max(150).warning('Use a clear, concise headline.'),
    }),

    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'The URL-friendly identifier for this article.',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (rule) => rule.required(),
    }),

        defineField({
      name: 'language',
      title: 'Content Language',
      type: 'string',
      description: 'The primary language used in this article.',
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
        'Optional reference to the corresponding article in the other language.',
      to: [{type: 'newsArticle'}],
      options: {
        filter: ({document}) => {
          const language = document?.language

          if (language === 'ne') {
            return {
              filter: 'language == $language',
              params: {language: 'nb'},
            }
          }

          if (language === 'nb') {
            return {
              filter: 'language == $language',
              params: {language: 'ne'},
            }
          }

          return {}
        },
      },
      validation: (rule) =>
        rule.custom((translation, context) => {
          if (!translation?._ref) {
            return true
          }

          const currentDocumentId = context.document?._id?.replace(
            /^drafts\./,
            '',
          )
          const translationId = translation._ref.replace(/^drafts\./, '')

          return currentDocumentId === translationId
            ? 'An article cannot reference itself as its translation.'
            : true
        }),
    }),

    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'text',
      rows: 4,
      description: 'A short introduction used on news cards and archive pages.',
      validation: (rule) => rule.required().min(40).max(300),
    }),

    defineField({
      name: 'newsRegion',
      title: 'News Region',
      type: 'string',
      description: 'Identifies the geographic focus of the article.',
      options: {
        list: [
          {title: 'Norway', value: 'norway'},
          {title: 'Nepal', value: 'nepal'},
          {title: 'Community in Norway', value: 'community'},
          {title: 'International', value: 'international'},
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          {title: 'Current Affairs', value: 'current-affairs'},
          {title: 'Immigration and Integration', value: 'immigration-integration'},
          {title: 'Education and Student Life', value: 'education-student-life'},
          {title: 'Employment and Economy', value: 'employment-economy'},
          {title: 'Culture and Community', value: 'culture-community'},
          {title: 'Health and Welfare', value: 'health-welfare'},
          {title: 'Sports', value: 'sports'},
        ],
      },
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'featuredImage',
      title: 'Featured Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alternative Text',
          type: 'string',
          description: 'Describe the image for accessibility and search engines.',
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: 'caption',
          title: 'Caption',
          type: 'string',
        }),
        defineField({
          name: 'credit',
          title: 'Image Credit',
          type: 'string',
        }),
      ],
    }),

    defineField({
      name: 'body',
      title: 'Article Content',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'block',
        }),
        defineArrayMember({
          type: 'image',
          options: {
            hotspot: true,
          },
          fields: [
            defineField({
              name: 'alt',
              title: 'Alternative Text',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'caption',
              title: 'Caption',
              type: 'string',
            }),
            defineField({
              name: 'credit',
              title: 'Image Credit',
              type: 'string',
            }),
          ],
        }),
      ],
      validation: (rule) => rule.required().min(1),
    }),

    defineField({
      name: 'authorName',
      title: 'Author Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'sourceUrl',
      title: 'Original Source URL',
      type: 'url',
      description:
        'For translated or contextualized reporting, link to the original source.',
      validation: (rule) =>
        rule.uri({
          scheme: ['http', 'https'],
        }),
    }),

    defineField({
      name: 'isFeatured',
      title: 'Feature on Homepage',
      type: 'boolean',
      description:
        'Select one strong editorial story for prominent homepage placement.',
      initialValue: false,
    }),

    defineField({
      name: 'isImportantNow',
      title: 'Important Now',
      type: 'boolean',
      description:
        'Use only for significant, time-sensitive information the community should see quickly. Avoid routine updates and sensational wording.',
      initialValue: false,
    }),

    defineField({
      name: 'importantUntil',
      title: 'Important Until',
      type: 'datetime',
      description:
        'The notice automatically stops appearing in the Important Now area after this time.',
      hidden: ({document}) => document?.isImportantNow !== true,
      validation: (rule) =>
        rule.custom((importantUntil, context) => {
          if (context.document?.isImportantNow !== true) {
            return true
          }

          if (!importantUntil) {
            return 'Set an expiry time for Important Now notices.'
          }

          return new Date(importantUntil) > new Date()
            ? true
            : 'The Important Until time must be in the future.'
        }),
    }),
  ],

  orderings: [
    {
      title: 'Publication date, newest first',
      name: 'publishedAtDesc',
      by: [{field: 'publishedAt', direction: 'desc'}],
    },
  ],

  preview: {
    select: {
      title: 'title',
      region: 'newsRegion',
      publishedAt: 'publishedAt',
      isFeatured: 'isFeatured',
      isImportantNow: 'isImportantNow',
      importantUntil: 'importantUntil',
      media: 'featuredImage',
    },
    prepare({
      title,
      region,
      publishedAt,
      isFeatured,
      isImportantNow,
      importantUntil,
      media,
    }) {
      const date = publishedAt
        ? new Date(publishedAt).toLocaleDateString('en-GB')
        : 'No publication date'
      const labels = [
        isImportantNow ? 'IMPORTANT NOW' : null,
        isFeatured ? 'FEATURED' : null,
        region ?? 'No region',
        date,
        isImportantNow && importantUntil
          ? `until ${new Date(importantUntil).toLocaleString('en-GB')}`
          : null,
      ].filter(Boolean)

      return {
        title,
        subtitle: labels.join(' · '),
        media,
      }
    },
  },
})