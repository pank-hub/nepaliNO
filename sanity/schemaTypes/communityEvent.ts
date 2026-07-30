import {defineArrayMember, defineField, defineType} from 'sanity'

export const communityEvent = defineType({
  name: 'communityEvent',
  title: 'Community Event',
  type: 'document',

  fields: [
    defineField({
      name: 'title',
      title: 'Event Title',
      type: 'string',
      description: 'The public title written in the selected content language.',
      validation: (rule) => rule.required().min(5).max(150),
    }),

    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'The stable URL-friendly identifier for this event.',
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
      description: 'Optional reference to the corresponding event in the other language.',
      to: [{type: 'communityEvent'}],
      options: {
        filter: ({document}) => {
          const language = document?.language

          if (language === 'ne') {
            return {filter: 'language == $language', params: {language: 'nb'}}
          }

          if (language === 'nb') {
            return {filter: 'language == $language', params: {language: 'ne'}}
          }

          return {}
        },
      },
      validation: (rule) =>
        rule.custom((translation, context) => {
          if (!translation?._ref) {
            return true
          }

          const currentDocumentId = context.document?._id?.replace(/^drafts\./, '')
          const translationId = translation._ref.replace(/^drafts\./, '')

          return currentDocumentId === translationId
            ? 'An event cannot reference itself as its translation.'
            : true
        }),
    }),

    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'text',
      rows: 4,
      description: 'A short introduction used on event cards and archive pages.',
      validation: (rule) => rule.required().min(30).max(300),
    }),

    defineField({
      name: 'eventLanguages',
      title: 'Languages Used at the Event',
      type: 'array',
      description:
        'Select the spoken or working languages used during the event. This is separate from the language of the nepali.no event page.',
      of: [{type: 'string'}],
      options: {
        list: [
          {title: 'Nepali', value: 'nepali'},
          {title: 'Norwegian', value: 'norwegian'},
          {title: 'English', value: 'english'},
          {title: 'Language-independent', value: 'language-independent'},
          {title: 'Other', value: 'other'},
        ],
        layout: 'grid',
      },
      validation: (rule) =>
        rule
          .required()
          .min(1)
          .unique()
          .custom((eventLanguages) => {
            if (
              Array.isArray(eventLanguages) &&
              eventLanguages.includes('language-independent') &&
              eventLanguages.length > 1
            ) {
              return 'Language-independent cannot be combined with spoken or working languages.'
            }

            return true
          }),
    }),

    defineField({
      name: 'otherEventLanguage',
      title: 'Other Event Language',
      type: 'string',
      description: 'Specify the event language when Other is selected.',
      hidden: ({document}) => {
        const eventLanguages = document?.eventLanguages
        return !Array.isArray(eventLanguages) || !eventLanguages.includes('other')
      },
      validation: (rule) =>
        rule.custom((otherEventLanguage, context) => {
          const eventLanguages = context.document?.eventLanguages
          const requiresOtherLanguage =
            Array.isArray(eventLanguages) && eventLanguages.includes('other')

          return requiresOtherLanguage && !otherEventLanguage
            ? 'Specify the other event language.'
            : true
        }),
    }),

    defineField({
      name: 'eventType',
      title: 'Event Type',
      type: 'string',
      options: {
        list: [
          {title: 'Cultural Celebration', value: 'cultural-celebration'},
          {title: 'Festival', value: 'festival'},
          {title: 'Concert or Visiting Artist', value: 'concert-artist'},
          {title: 'Community Gathering', value: 'community-gathering'},
          {title: 'Social Meetup', value: 'social-meetup'},
          {title: 'Student or Youth Program', value: 'student-youth'},
          {title: 'Children and Family Activity', value: 'children-family'},
          {title: 'Workshop or Seminar', value: 'workshop-seminar'},
          {title: 'Information and Integration Session', value: 'information-integration'},
          {title: 'Sports Tournament or Recreation', value: 'sports-recreation'},
          {title: 'Religious or Traditional Program', value: 'religious-traditional'},
          {title: 'Charity, Fundraising or Volunteering', value: 'charity-volunteering'},
          {title: 'Business and Networking', value: 'business-networking'},
          {title: 'Other Community Event', value: 'other'},
        ],
      },
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'eventFormat',
      title: 'Event Format',
      type: 'string',
      options: {
        list: [
          {title: 'In person', value: 'in-person'},
          {title: 'Online', value: 'online'},
          {title: 'Hybrid', value: 'hybrid'},
        ],
        layout: 'radio',
      },
      initialValue: 'in-person',
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'eventStatus',
      title: 'Event Status',
      type: 'string',
      options: {
        list: [
          {title: 'Scheduled', value: 'scheduled'},
          {title: 'Postponed', value: 'postponed'},
          {title: 'Rescheduled', value: 'rescheduled'},
          {title: 'Cancelled', value: 'cancelled'},
        ],
        layout: 'radio',
      },
      initialValue: 'scheduled',
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'isAllDay',
      title: 'All-day Event',
      type: 'boolean',
      description: 'Use when exact public start and end times are not the main presentation.',
      initialValue: false,
    }),

    defineField({
      name: 'startDateTime',
      title: 'Start Date and Time',
      type: 'datetime',
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'endDateTime',
      title: 'End Date and Time',
      type: 'datetime',
      description: 'Recommended for all-day, multi-day and longer events.',
      validation: (rule) =>
        rule.custom((endDateTime, context) => {
          const startDateTime = context.document?.startDateTime

          if (!endDateTime || !startDateTime) {
            return true
          }

          return new Date(endDateTime as string) > new Date(startDateTime as string)
            ? true
            : 'The end time must be later than the start time.'
        }),
    }),

    defineField({
      name: 'venueName',
      title: 'Venue Name',
      type: 'string',
      hidden: ({document}) => document?.eventFormat === 'online',
    }),

    defineField({
      name: 'address',
      title: 'Street Address',
      type: 'string',
      hidden: ({document}) => document?.eventFormat === 'online',
    }),

    defineField({
      name: 'postalCode',
      title: 'Postal Code',
      type: 'string',
      hidden: ({document}) => document?.eventFormat === 'online',
    }),

    defineField({
      name: 'city',
      title: 'City',
      type: 'string',
      hidden: ({document}) => document?.eventFormat === 'online',
      validation: (rule) =>
        rule.custom((city, context) => {
          if (context.document?.eventFormat === 'online') {
            return true
          }

          return city ? true : 'City is required for an in-person or hybrid event.'
        }),
    }),

    defineField({
      name: 'mapUrl',
      title: 'Map URL',
      type: 'url',
      hidden: ({document}) => document?.eventFormat === 'online',
      validation: (rule) => rule.uri({scheme: ['http', 'https']}),
    }),

    defineField({
      name: 'accessibilityInformation',
      title: 'Accessibility Information',
      type: 'text',
      rows: 3,
      hidden: ({document}) => document?.eventFormat === 'online',
    }),

    defineField({
      name: 'transportInformation',
      title: 'Transport or Parking Information',
      type: 'text',
      rows: 3,
      hidden: ({document}) => document?.eventFormat === 'online',
    }),

    defineField({
      name: 'onlinePlatform',
      title: 'Online Platform',
      type: 'string',
      hidden: ({document}) => document?.eventFormat === 'in-person',
    }),

    defineField({
      name: 'onlineUrl',
      title: 'Online Event or Information URL',
      type: 'url',
      description: 'Use a public event or joining-information page. Avoid exposing private meeting links.',
      hidden: ({document}) => document?.eventFormat === 'in-person',
      validation: (rule) => rule.uri({scheme: ['http', 'https']}),
    }),

    defineField({
      name: 'organizerName',
      title: 'Organizer Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'organizerUrl',
      title: 'Organizer Website or Public Page',
      type: 'url',
      validation: (rule) => rule.uri({scheme: ['http', 'https']}),
    }),

    defineField({
      name: 'organizerEmail',
      title: 'Public Organizer Email',
      type: 'email',
      description: 'Publish only an email address intended for public event enquiries.',
    }),

    defineField({
      name: 'organizerPhone',
      title: 'Public Organizer Phone',
      type: 'string',
      description: 'Publish only a phone number intended for public event enquiries.',
    }),

    defineField({
      name: 'registrationRequirement',
      title: 'Registration Requirement',
      type: 'string',
      options: {
        list: [
          {title: 'No registration required', value: 'not-required'},
          {title: 'Registration recommended', value: 'recommended'},
          {title: 'Registration required', value: 'required'},
          {title: 'Tickets required', value: 'tickets-required'},
        ],
        layout: 'radio',
      },
      initialValue: 'not-required',
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'registrationStatus',
      title: 'Registration Status',
      type: 'string',
      options: {
        list: [
          {title: 'Not applicable', value: 'not-applicable'},
          {title: 'Not yet open', value: 'not-yet-open'},
          {title: 'Open', value: 'open'},
          {title: 'Closed', value: 'closed'},
          {title: 'Sold out', value: 'sold-out'},
        ],
        layout: 'radio',
      },
      initialValue: 'not-applicable',
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'registrationUrl',
      title: 'External Registration or Ticket URL',
      type: 'url',
      description: 'Registration and payment are handled by the organizer or external service.',
      hidden: ({document}) => document?.registrationRequirement === 'not-required',
      validation: (rule) => rule.uri({scheme: ['http', 'https']}),
    }),

    defineField({
      name: 'registrationDeadline',
      title: 'Registration Deadline',
      type: 'datetime',
      hidden: ({document}) => document?.registrationRequirement === 'not-required',
    }),

    defineField({
      name: 'isFree',
      title: 'Free Event',
      type: 'boolean',
      initialValue: true,
    }),

    defineField({
      name: 'priceNok',
      title: 'Simple Price in NOK',
      type: 'number',
      hidden: ({document}) => document?.isFree !== false,
      validation: (rule) => rule.min(0),
    }),

    defineField({
      name: 'priceDescription',
      title: 'Public Price Description',
      type: 'string',
      description: 'Use for child, adult, family, member or donation-based pricing.',
      hidden: ({document}) => document?.isFree !== false,
      validation: (rule) => rule.max(200),
    }),

    defineField({
      name: 'intendedAudience',
      title: 'Intended Audience',
      type: 'string',
      description: 'Optional concise audience or age guidance.',
      validation: (rule) => rule.max(200),
    }),

    defineField({
      name: 'featuredImage',
      title: 'Event Image',
      type: 'image',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: 'Alternative Text',
          type: 'string',
          description: 'Describe the image for accessibility. Do not rely on a poster for essential details.',
          validation: (rule) => rule.required(),
        }),
        defineField({name: 'caption', title: 'Caption', type: 'string'}),
        defineField({name: 'credit', title: 'Image Credit', type: 'string'}),
      ],
    }),

    defineField({
      name: 'description',
      title: 'Event Description',
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
      validation: (rule) => rule.required().min(1),
    }),

    defineField({
      name: 'sourceUrl',
      title: 'Original Event or Source URL',
      type: 'url',
      description: 'Link to the organizer announcement, Facebook event or original public source.',
      validation: (rule) => rule.uri({scheme: ['http', 'https']}),
    }),

    defineField({
      name: 'lastVerifiedAt',
      title: 'Last Verified At',
      type: 'date',
      description: 'Date when nepali.no last checked the public event details.',
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'editorialReviewer',
      title: 'Editorial Reviewer',
      type: 'string',
      validation: (rule) => rule.required(),
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
      title: 'Event date, soonest first',
      name: 'startDateTimeAsc',
      by: [{field: 'startDateTime', direction: 'asc'}],
    },
    {
      title: 'Event date, latest first',
      name: 'startDateTimeDesc',
      by: [{field: 'startDateTime', direction: 'desc'}],
    },
  ],

  preview: {
    select: {
      title: 'title',
      language: 'language',
      startDateTime: 'startDateTime',
      city: 'city',
      eventFormat: 'eventFormat',
      eventStatus: 'eventStatus',
      registrationStatus: 'registrationStatus',
      media: 'featuredImage',
    },
    prepare({
      title,
      language,
      startDateTime,
      city,
      eventFormat,
      eventStatus,
      registrationStatus,
      media,
    }) {
      const date = startDateTime
        ? new Date(startDateTime).toLocaleString('en-GB')
        : 'Date not specified'
      const location =
        eventFormat === 'online'
          ? 'Online'
          : eventFormat === 'hybrid'
            ? `Hybrid${city ? ` · ${city}` : ''}`
            : city || 'Location not specified'
      const status = eventStatus && eventStatus !== 'scheduled' ? `${eventStatus} · ` : ''
      const registration =
        registrationStatus && !['not-applicable', 'open'].includes(registrationStatus)
          ? ` · ${registrationStatus}`
          : ''

      return {
        title,
        subtitle: `${status}${date} · ${location} · ${language ?? 'No language'}${registration}`,
        media,
      }
    },
  },
})
