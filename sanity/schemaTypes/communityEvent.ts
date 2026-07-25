import {defineField, defineType} from 'sanity'

export const communityEvent = defineType({
  name: 'communityEvent',
  title: 'Community Event',
  type: 'document',

  fields: [
    defineField({
      name: 'title',
      title: 'Event Title',
      type: 'string',
      description: 'The public title of the event, preferably written in Nepali.',
      validation: (rule) => rule.required().min(5).max(150),
    }),

    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'The URL-friendly identifier for the event.',
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
      description:
        'A short description used on event cards and calendar listings.',
      validation: (rule) => rule.required().min(30).max(300),
    }),

    defineField({
      name: 'eventType',
      title: 'Event Type',
      type: 'string',
      options: {
        list: [
          {title: 'Cultural Celebration', value: 'cultural-celebration'},
          {title: 'Community Gathering', value: 'community-gathering'},
          {title: 'Social Meetup', value: 'social-meetup'},
          {title: 'Student Program', value: 'student-program'},
          {title: 'Workshop or Seminar', value: 'workshop-seminar'},
          {title: 'Sports and Recreation', value: 'sports-recreation'},
          {title: 'Religious Program', value: 'religious-program'},
          {title: 'Charity and Volunteering', value: 'charity-volunteering'},
          {title: 'Other', value: 'other'},
        ],
      },
      validation: (rule) => rule.required(),
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
      validation: (rule) =>
        rule.custom((endDateTime, context) => {
          const startDateTime = context.document?.startDateTime

          if (!endDateTime || !startDateTime) {
            return true
          }

          return new Date(endDateTime as string) >
            new Date(startDateTime as string)
            ? true
            : 'The end time must be later than the start time.'
        }),
    }),

    defineField({
      name: 'isOnline',
      title: 'Online Event',
      type: 'boolean',
      initialValue: false,
    }),

    defineField({
      name: 'venueName',
      title: 'Venue Name',
      type: 'string',
      hidden: ({document}) => document?.isOnline === true,
    }),

    defineField({
      name: 'address',
      title: 'Street Address',
      type: 'string',
      hidden: ({document}) => document?.isOnline === true,
    }),

    defineField({
      name: 'city',
      title: 'City',
      type: 'string',
      hidden: ({document}) => document?.isOnline === true,
      validation: (rule) =>
        rule.custom((city, context) => {
          if (context.document?.isOnline === true) {
            return true
          }

          return city ? true : 'City is required for an in-person event.'
        }),
    }),

    defineField({
      name: 'onlineUrl',
      title: 'Online Event URL',
      type: 'url',
      hidden: ({document}) => document?.isOnline !== true,
      validation: (rule) =>
        rule.uri({
          scheme: ['http', 'https'],
        }),
    }),

    defineField({
      name: 'organizerName',
      title: 'Organizer Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'organizerEmail',
      title: 'Organizer Email',
      type: 'email',
    }),

    defineField({
      name: 'organizerPhone',
      title: 'Organizer Phone',
      type: 'string',
    }),

    defineField({
      name: 'registrationUrl',
      title: 'Registration URL',
      type: 'url',
      description: 'Optional link for registration or ticket booking.',
      validation: (rule) =>
        rule.uri({
          scheme: ['http', 'https'],
        }),
    }),

    defineField({
      name: 'isFree',
      title: 'Free Event',
      type: 'boolean',
      initialValue: true,
    }),

    defineField({
      name: 'priceNok',
      title: 'Price in NOK',
      type: 'number',
      hidden: ({document}) => document?.isFree !== false,
      validation: (rule) => rule.min(0),
    }),

    defineField({
      name: 'featuredImage',
      title: 'Event Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alternative Text',
          type: 'string',
          description: 'Describe the image for accessibility.',
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
      name: 'description',
      title: 'Event Description',
      type: 'array',
      of: [{type: 'block'}],
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'isFeatured',
      title: 'Feature on Homepage',
      type: 'boolean',
      initialValue: false,
    }),

    defineField({
      name: 'isCancelled',
      title: 'Event Cancelled',
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
      startDateTime: 'startDateTime',
      city: 'city',
      isOnline: 'isOnline',
      isCancelled: 'isCancelled',
      media: 'featuredImage',
    },
    prepare({
      title,
      startDateTime,
      city,
      isOnline,
      isCancelled,
      media,
    }) {
      const date = startDateTime
        ? new Date(startDateTime).toLocaleString('en-GB')
        : 'Date not specified'

      const location = isOnline ? 'Online event' : city || 'Location not specified'
      const status = isCancelled ? 'Cancelled · ' : ''

      return {
        title,
        subtitle: `${status}${date} · ${location}`,
        media,
      }
    },
  },
})