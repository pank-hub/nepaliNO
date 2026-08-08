import {defineArrayMember, defineField, defineType} from 'sanity'

export const publicInformationGuide = defineType({
  name: 'publicInformationGuide',
  title: 'Public Information Guide',
  type: 'document',

  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Write the title in the selected content language.',
      validation: (rule) => rule.required().min(8).max(160),
    }),

    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'The URL-friendly identifier for this guide.',
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
        'Optional reference to the corresponding guide in the other language.',
      to: [{type: 'publicInformationGuide'}],
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
            ? 'A guide cannot reference itself as its translation.'
            : true
        }),
    }),

    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'text',
      rows: 4,
      description: 'A plain-language introduction for cards and search results.',
      validation: (rule) => rule.required().min(40).max(350),
    }),

    defineField({
      name: 'searchKeywords',
      title: 'Search Keywords and Synonyms',
      type: 'array',
      description:
        'Optional search terms in the guide language. Include everyday Nepali phrases, Norwegian official terminology, abbreviations, synonyms, and common alternative spellings where relevant. These terms are editorial metadata and do not need to be displayed publicly.',
      of: [
        defineArrayMember({
          type: 'string',
          validation: (rule) => rule.required().min(2).max(100),
        }),
      ],
      validation: (rule) => rule.unique().max(30),
    }),
    defineField({
      name: 'relatedGuides',
      title: 'Related Guides',
      type: 'array',
      description:
        'Optional links to other guides in the same language. Do not use this field for translations.',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{type: 'publicInformationGuide'}],
          options: {
            filter: ({document}) => {
              const currentId = document?._id?.replace(/^drafts\./, '')
              const draftId = currentId ? `drafts.${currentId}` : ''
              const language = document?.language

              if (currentId && language) {
                return {
                  filter:
                    'language == $language && _id != $currentId && _id != $draftId',
                  params: {language, currentId, draftId},
                }
              }

              if (currentId) {
                return {
                  filter: '_id != $currentId && _id != $draftId',
                  params: {currentId, draftId},
                }
              }

              return {}
            },
          },
        }),
      ],
      validation: (rule) => rule.unique().max(8),
    }),

    defineField({
      name: 'forumCompanionAutomation',
      title: 'Forum Companion Workflow',
      type: 'forumCompanionAutomation',
      description:
        'Optional workflow choice for Guide questions and experiences. Automatic mode will later create a topic in Questions about Guides only after the Guide is active.',
      validation: (rule) =>
        rule.custom((automation, context) => {
          const mode = (automation as {mode?: string} | undefined)?.mode
          const topicId = (
            context.document?.forumQuestionsTopic as {topicId?: number} | undefined
          )?.topicId

          if (mode === 'manual' && !topicId) {
            return 'Manual mode requires a Forum Questions and Experiences topic ID.'
          }

          return true
        }),
    }),

    defineField({
      name: 'forumQuestionsTopic',
      title: 'Forum Questions and Experiences Topic',
      type: 'forumTopicReference',
      description:
        'Optional editorial connection to the long-lived Discourse topic for follow-up questions and practical community experiences related to this Guide. This topic should normally remain open.',
    }),

    defineField({
      name: 'relatedForumTopics',
      title: 'Related Forum Topics',
      type: 'array',
      description:
        'Optional manually curated Forum topics related to this Guide. Select no more than three. Community discussion never replaces verified guidance.',
      of: [{type: 'forumTopicReference'}],
      validation: (rule) =>
        rule.max(3).custom((items) => {
          if (!items) return true
          const topicIds = items
            .map((item) => (item as {topicId?: number})?.topicId)
            .filter((topicId): topicId is number => typeof topicId === 'number')
          return new Set(topicIds).size === topicIds.length
            ? true
            : 'Each related Forum topic ID must be unique.'
        }),
    }),

    defineField({
      name: 'guideFormat',
      title: 'Guide Format',
      type: 'string',
      description:
        'Optional editorial classification describing how the guide helps the reader. This metadata is not currently displayed publicly.',
      options: {
        list: [
          {title: 'Quick answer', value: 'quick-answer'},
          {title: 'Step-by-step guide', value: 'step-by-step'},
          {title: 'Comprehensive guide', value: 'comprehensive-guide'},
          {title: 'Checklist', value: 'checklist'},
          {title: 'Explainer', value: 'explainer'},
          {title: 'Emergency information', value: 'emergency-information'},
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'editorialPriority',
      title: 'Editorial Priority',
      type: 'string',
      description:
        'Optional editorial classification indicating how important this guide is within its topic and audience. This metadata is not currently displayed publicly.',
      options: {
        list: [
          {
            title: 'Essential',
            value: 'essential',
          },
          {
            title: 'Recommended',
            value: 'recommended',
          },
          {
            title: 'Specialist',
            value: 'specialist',
          },
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'maintenanceSensitivity',
      title: 'Maintenance Sensitivity',
      type: 'string',
      description:
        'Optional editorial classification indicating how closely this guide should be monitored for changes. Review dates remain required and are managed separately.',
      options: {
        list: [
          {
            title: 'High',
            value: 'high',
          },
          {
            title: 'Medium',
            value: 'medium',
          },
          {
            title: 'Low',
            value: 'low',
          },
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'topic',
      title: 'Topic',
      type: 'string',
      options: {
        list: [
          {title: 'Immigration and Residence', value: 'immigration-residence'},
          {title: 'Work and Employment', value: 'work-employment'},
          {title: 'Tax and Personal Finance', value: 'tax-finance'},
          {title: 'Moving and Population Register', value: 'moving-population-register'},
          {title: 'Education and Student Life', value: 'education-student-life'},
          {title: 'Health Services', value: 'health-services'},
          {title: 'Family and Children', value: 'family-children'},
          {title: 'Housing', value: 'housing'},
          {title: 'Norwegian Language and Integration', value: 'language-integration'},
          {title: 'Digital Public Services and e-ID', value: 'digital-services-eid'},
          {title: 'Citizenship and Civic Participation', value: 'citizenship-participation'},
          {title: 'Rights, Safety, and Discrimination', value: 'rights-safety-discrimination'},
          {title: 'Transport and Driving', value: 'transport-driving'},
          {title: 'Other', value: 'other'},
        ],
      },
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'intendedAudience',
      title: 'Intended Audience',
      type: 'array',
      of: [{type: 'string'}],
      options: {
        list: [
          {title: 'Newly arrived residents', value: 'newly-arrived'},
          {title: 'Workers and job seekers', value: 'workers-job-seekers'},
          {title: 'Students and young adults', value: 'students-young-adults'},
          {title: 'Families and parents', value: 'families-parents'},
          {title: 'Young Nepali Norwegians', value: 'young-nepali-norwegians'},
          {title: 'Businesses and self-employed people', value: 'business-self-employed'},
          {title: 'Volunteers and community organizations', value: 'volunteers-organizations'},
          {title: 'Everyone', value: 'everyone'},
        ],
      },
      validation: (rule) => rule.required().min(1),
    }),

    defineField({
      name: 'body',
      title: 'Guide Content',
      type: 'array',
      of: [
        defineArrayMember({type: 'block'}),
        defineArrayMember({
          type: 'image',
          options: {hotspot: true},
          fields: [
            defineField({
              name: 'alt',
              title: 'Alternative Text',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({name: 'caption', title: 'Caption', type: 'string'}),
            defineField({name: 'credit', title: 'Image Credit', type: 'string'}),
          ],
        }),
      ],
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'responsibleAgency',
      title: 'Responsible Public Agency',
      type: 'string',
      description: 'For example: UDI, Skatteetaten, NAV, or Helsenorge.',
      validation: (rule) => rule.required().min(2).max(120),
    }),

    defineField({
      name: 'officialSourceUrl',
      title: 'Primary Official Source URL',
      type: 'url',
      description: 'Link directly to the current official information.',
      validation: (rule) =>
        rule.required().uri({scheme: ['https']}),
    }),

    defineField({
      name: 'additionalOfficialLinks',
      title: 'Additional Official Links',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'officialLink',
          title: 'Official Link',
          fields: [
            defineField({
              name: 'label',
              title: 'Link Label',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'url',
              title: 'URL',
              type: 'url',
              validation: (rule) =>
                rule.required().uri({scheme: ['https']}),
            }),
          ],
          preview: {
            select: {title: 'label', subtitle: 'url'},
          },
        }),
      ],
    }),

    defineField({
      name: 'importantTerms',
      title: 'Important Norwegian Terms',
      type: 'array',
      description:
        'Explain official Norwegian terms that readers may encounter when contacting authorities.',
      of: [
        defineArrayMember({
          type: 'reference',
          name: 'reusableNorwegianTerm',
          title: 'Select Reusable Norwegian Term',
          to: [{type: 'norwegianTerm'}],
          options: {
            filter: ({document}) => {
              if (!document?.language) return {filter: 'isActive == true'}

              return {
                filter: 'language == $language && isActive == true',
                params: {language: document.language},
              }
            },
          },
        }),
        defineArrayMember({
          type: 'object',
          name: 'importantTerm',
          title: 'Legacy Inline Term',
          fields: [
            defineField({
              name: 'term',
              title: 'Norwegian Term',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'explanation',
              title: 'Explanation',
              type: 'text',
              rows: 3,
              validation: (rule) => rule.required(),
            }),
          ],
          preview: {
            select: {title: 'term', subtitle: 'explanation'},
          },
        }),
      ],
    }),

    defineField({
      name: 'editorialReviewer',
      title: 'Editorial Reviewer',
      type: 'string',
      description: 'The person or team responsible for checking this guide.',
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
      name: 'lastReviewedAt',
      title: 'Last Reviewed At',
      type: 'date',
      description: 'The date on which the official source was last checked.',
      validation: (rule) => rule.required().max(new Date().toISOString().slice(0, 10)),
    }),

    defineField({
      name: 'nextReviewAt',
      title: 'Next Review Due',
      type: 'date',
      validation: (rule) =>
        rule.required().custom((nextReviewAt, context) => {
          const lastReviewedAt = context.document?.lastReviewedAt

          if (!nextReviewAt || !lastReviewedAt) return true

          return nextReviewAt > lastReviewedAt
            ? true
            : 'The next review date must be later than the last-reviewed date.'
        }),
    }),

    defineField({
      name: 'status',
      title: 'Guide Status',
      type: 'string',
      options: {
        list: [
          {title: 'Draft', value: 'draft'},
          {title: 'Active', value: 'active'},
          {title: 'Needs Review', value: 'needs-review'},
          {title: 'Archived', value: 'archived'},
        ],
        layout: 'radio',
      },
      initialValue: 'draft',
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'isFeatured',
      title: 'Featured Guide',
      type: 'boolean',
      initialValue: false,
    }),

    defineField({
      name: 'isUrgent',
      title: 'Urgent Information',
      type: 'boolean',
      description:
        'Use only for time-sensitive information that requires prominent placement.',
      initialValue: false,
    }),

    defineField({
      name: 'fundingAcknowledgement',
      title: 'Funding or Partner Acknowledgement',
      type: 'text',
      rows: 3,
      description:
        'Optional acknowledgement for a funder or partner. Editorial responsibility remains with nepali.no.',
    }),
  ],

  orderings: [
    {
      title: 'Review due date, soonest first',
      name: 'nextReviewAtAsc',
      by: [{field: 'nextReviewAt', direction: 'asc'}],
    },
    {
      title: 'Publication date, newest first',
      name: 'publishedAtDesc',
      by: [{field: 'publishedAt', direction: 'desc'}],
    },
  ],

  preview: {
    select: {
      title: 'title',
      language: 'language',
      agency: 'responsibleAgency',
      status: 'status',
      nextReviewAt: 'nextReviewAt',
    },
    prepare({title, language, agency, status, nextReviewAt}) {
      const languageLabel = language === 'nb' ? 'Norsk' : 'नेपाली'
      const reviewLabel = nextReviewAt
        ? `Review due ${nextReviewAt}`
        : 'No review date'

      return {
        title,
        subtitle: `${languageLabel} · ${agency || 'No agency'} · ${status || 'draft'} · ${reviewLabel}`,
      }
    },
  },
})
