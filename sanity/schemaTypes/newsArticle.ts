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
      description: 'The main headline, preferably written in Nepali.',
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
          ],
        }),
      ],
      validation: (rule) => rule.required(),
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
      initialValue: false,
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
      media: 'featuredImage',
    },
    prepare({title, region, publishedAt, media}) {
      const date = publishedAt
        ? new Date(publishedAt).toLocaleDateString('en-GB')
        : 'No publication date'

      return {
        title,
        subtitle: `${region ?? 'No region'} · ${date}`,
        media,
      }
    },
  },
})