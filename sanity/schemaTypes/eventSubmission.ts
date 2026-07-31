import {defineField, defineType} from 'sanity'

const moderationStatuses = [
  {title: 'New', value: 'new'},
  {title: 'Under review', value: 'under-review'},
  {title: 'More information requested', value: 'more-information-requested'},
  {title: 'Approved', value: 'approved'},
  {title: 'Converted to public Event', value: 'converted'},
  {title: 'Rejected', value: 'rejected'},
  {title: 'Duplicate', value: 'duplicate'},
  {title: 'Withdrawn', value: 'withdrawn'},
  {title: 'Archived', value: 'archived'},
]

const interfaceLanguages = [
  {title: 'Nepali', value: 'ne'},
  {title: 'Norwegian Bokmal', value: 'nb'},
  {title: 'English', value: 'en'},
]

const submissionLanguages = [
  ...interfaceLanguages,
  {title: 'Other', value: 'other'},
]

const publicOutputPreferences = [
  {title: 'Nepali public page', value: 'ne'},
  {title: 'Norwegian public page', value: 'nb'},
  {title: 'Both Nepali and Norwegian public pages', value: 'both'},
  {title: 'No preference - nepali.no may decide', value: 'editorial-decision'},
]

const eventLanguages = [
  {title: 'Nepali', value: 'nepali'},
  {title: 'Norwegian', value: 'norwegian'},
  {title: 'English', value: 'english'},
  {title: 'Language-independent', value: 'language-independent'},
  {title: 'Other', value: 'other'},
]

const eventTypes = [
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
]

export const eventSubmission = defineType({
  name: 'eventSubmission',
  title: 'Event Submission',
  type: 'document',
  description:
    'Private organizer proposal for moderation. A submission must never publish automatically as a Community Event.',

  groups: [
    {name: 'moderation', title: 'Moderation', default: true},
    {name: 'organizer', title: 'Private Organizer Contact'},
    {name: 'publicContact', title: 'Proposed Public Contact'},
    {name: 'event', title: 'Event Information'},
    {name: 'registration', title: 'Registration and Price'},
    {name: 'image', title: 'Image Proposal'},
    {name: 'declarations', title: 'Declarations'},
  ],

  fields: [
    defineField({
      name: 'moderationStatus',
      title: 'Moderation Status',
      type: 'string',
      group: 'moderation',
      options: {list: moderationStatuses, layout: 'radio'},
      initialValue: 'new',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'submittedAt',
      title: 'Submitted At',
      type: 'datetime',
      group: 'moderation',
      description: 'Set by the secure server endpoint. Never trust a browser-supplied value.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'formInterfaceLanguage',
      title: 'Form Interface Language',
      type: 'string',
      group: 'moderation',
      options: {list: interfaceLanguages, layout: 'radio'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'submissionLanguage',
      title: 'Language Used in Submitted Information',
      type: 'string',
      group: 'moderation',
      options: {list: submissionLanguages, layout: 'radio'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'otherSubmissionLanguage',
      title: 'Other Submission Language',
      type: 'string',
      group: 'moderation',
      hidden: ({document}) => document?.submissionLanguage !== 'other',
      validation: (rule) =>
        rule.custom((value, context) =>
          context.document?.submissionLanguage === 'other' && !value
            ? 'Specify the language used in the submission.'
            : true,
        ),
    }),
    defineField({
      name: 'requestedPublicLanguage',
      title: 'Requested Public Page Language',
      type: 'string',
      group: 'moderation',
      options: {list: publicOutputPreferences, layout: 'radio'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'assignedReviewer',
      title: 'Assigned Reviewer',
      type: 'string',
      group: 'moderation',
      description: 'Internal field. Never supplied by the public form.',
    }),
    defineField({
      name: 'internalNotes',
      title: 'Internal Moderation Notes',
      type: 'text',
      rows: 5,
      group: 'moderation',
      description: 'Private staff notes. Never publish or copy automatically to a public Event.',
    }),
    defineField({
      name: 'clarificationNotes',
      title: 'Clarification and Follow-up Notes',
      type: 'text',
      rows: 5,
      group: 'moderation',
      description: 'Internal record of requested or received clarification.',
    }),
    defineField({
      name: 'retentionReviewDate',
      title: 'Retention Review Date',
      type: 'date',
      group: 'moderation',
      description: 'Date when staff should review whether the private submission can be deleted.',
    }),
    defineField({
      name: 'convertedEventId',
      title: 'Public Event Document ID',
      type: 'string',
      group: 'moderation',
      description: 'Store the final public Community Event ID after staff conversion. Cross-dataset references are not used.',
    }),
    defineField({
      name: 'convertedEventUrl',
      title: 'Public Event URL',
      type: 'url',
      group: 'moderation',
      validation: (rule) => rule.uri({scheme: ['http', 'https']}),
    }),
    defineField({
      name: 'convertedAt',
      title: 'Converted At',
      type: 'datetime',
      group: 'moderation',
    }),

    defineField({
      name: 'organizerName',
      title: 'Organizer or Organization Name',
      type: 'string',
      group: 'organizer',
      validation: (rule) => rule.required().min(2).max(150),
    }),
    defineField({
      name: 'privateContactName',
      title: 'Private Contact Person',
      type: 'string',
      group: 'organizer',
      validation: (rule) => rule.required().min(2).max(120),
    }),
    defineField({
      name: 'privateContactEmail',
      title: 'Private Contact Email',
      type: 'email',
      group: 'organizer',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'privateContactPhone',
      title: 'Private Contact Telephone',
      type: 'string',
      group: 'organizer',
      validation: (rule) => rule.max(40),
    }),
    defineField({
      name: 'preferredContactLanguage',
      title: 'Preferred Contact Language',
      type: 'string',
      group: 'organizer',
      options: {list: submissionLanguages, layout: 'radio'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'otherPreferredContactLanguage',
      title: 'Other Preferred Contact Language',
      type: 'string',
      group: 'organizer',
      hidden: ({document}) => document?.preferredContactLanguage !== 'other',
      validation: (rule) =>
        rule.custom((value, context) =>
          context.document?.preferredContactLanguage === 'other' && !value
            ? 'Specify the preferred contact language.'
            : true,
        ),
    }),

    defineField({
      name: 'publicOrganizerName',
      title: 'Proposed Public Organizer Name',
      type: 'string',
      group: 'publicContact',
      validation: (rule) => rule.max(150),
    }),
    defineField({
      name: 'publicOrganizerUrl',
      title: 'Proposed Public Website or Page',
      type: 'url',
      group: 'publicContact',
      validation: (rule) => rule.uri({scheme: ['http', 'https']}),
    }),
    defineField({
      name: 'publicOrganizerEmail',
      title: 'Proposed Public Email',
      type: 'email',
      group: 'publicContact',
    }),
    defineField({
      name: 'publicOrganizerPhone',
      title: 'Proposed Public Telephone',
      type: 'string',
      group: 'publicContact',
      validation: (rule) => rule.max(40),
    }),
    defineField({
      name: 'publicContactPermission',
      title: 'Permission to Publish Proposed Public Contacts',
      type: 'boolean',
      group: 'publicContact',
      initialValue: false,
      description: 'Required when a public email or telephone number is proposed.',
      validation: (rule) =>
        rule.custom((value, context) => {
          const hasPublicContact = Boolean(
            context.document?.publicOrganizerEmail || context.document?.publicOrganizerPhone,
          )
          return hasPublicContact && value !== true
            ? 'Permission is required before proposed public contact details may be used.'
            : true
        }),
    }),

    defineField({
      name: 'proposedTitle',
      title: 'Proposed Event Title',
      type: 'string',
      group: 'event',
      validation: (rule) => rule.required().min(5).max(150),
    }),
    defineField({
      name: 'summary',
      title: 'Short Event Summary',
      type: 'text',
      rows: 4,
      group: 'event',
      validation: (rule) => rule.required().min(30).max(600),
    }),
    defineField({
      name: 'descriptionPlainText',
      title: 'Full Event Description',
      type: 'text',
      rows: 10,
      group: 'event',
      description: 'Plain source information for editorial review. Essential details must not exist only in a poster.',
      validation: (rule) => rule.required().min(80).max(10000),
    }),
    defineField({
      name: 'eventLanguages',
      title: 'Languages Used at the Event',
      type: 'array',
      group: 'event',
      of: [{type: 'string'}],
      options: {list: eventLanguages, layout: 'grid'},
      validation: (rule) =>
        rule
          .required()
          .min(1)
          .unique()
          .custom((values) =>
            Array.isArray(values) && values.includes('language-independent') && values.length > 1
              ? 'Language-independent cannot be combined with spoken or working languages.'
              : true,
          ),
    }),
    defineField({
      name: 'otherEventLanguage',
      title: 'Other Event Language',
      type: 'string',
      group: 'event',
      hidden: ({document}) =>
        !Array.isArray(document?.eventLanguages) || !document.eventLanguages.includes('other'),
      validation: (rule) =>
        rule.custom((value, context) =>
          Array.isArray(context.document?.eventLanguages) &&
          context.document.eventLanguages.includes('other') &&
          !value
            ? 'Specify the other Event language.'
            : true,
        ),
    }),
    defineField({
      name: 'eventType',
      title: 'Event Type',
      type: 'string',
      group: 'event',
      options: {list: eventTypes},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'eventFormat',
      title: 'Event Format',
      type: 'string',
      group: 'event',
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
      name: 'isAllDay',
      title: 'All-day Event',
      type: 'boolean',
      group: 'event',
      initialValue: false,
    }),
    defineField({
      name: 'startDateTime',
      title: 'Start Date and Time',
      type: 'datetime',
      group: 'event',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'endDateTime',
      title: 'End Date and Time',
      type: 'datetime',
      group: 'event',
      validation: (rule) =>
        rule.custom((value, context) => {
          const start = context.document?.startDateTime
          if (!value || !start) return true
          return new Date(value as string) > new Date(start as string)
            ? true
            : 'The end time must be later than the start time.'
        }),
    }),
    defineField({
      name: 'venueName',
      title: 'Venue Name',
      type: 'string',
      group: 'event',
      hidden: ({document}) => document?.eventFormat === 'online',
      validation: (rule) => rule.max(180),
    }),
    defineField({
      name: 'address',
      title: 'Street Address',
      type: 'string',
      group: 'event',
      hidden: ({document}) => document?.eventFormat === 'online',
      validation: (rule) => rule.max(200),
    }),
    defineField({
      name: 'postalCode',
      title: 'Postal Code',
      type: 'string',
      group: 'event',
      hidden: ({document}) => document?.eventFormat === 'online',
      validation: (rule) => rule.max(20),
    }),
    defineField({
      name: 'city',
      title: 'City',
      type: 'string',
      group: 'event',
      hidden: ({document}) => document?.eventFormat === 'online',
      validation: (rule) =>
        rule.custom((value, context) =>
          context.document?.eventFormat !== 'online' && !value
            ? 'City is required for an in-person or hybrid Event.'
            : true,
        ),
    }),
    defineField({
      name: 'mapUrl',
      title: 'Map URL',
      type: 'url',
      group: 'event',
      hidden: ({document}) => document?.eventFormat === 'online',
      validation: (rule) => rule.uri({scheme: ['http', 'https']}),
    }),
    defineField({
      name: 'onlinePlatform',
      title: 'Online Platform',
      type: 'string',
      group: 'event',
      hidden: ({document}) => document?.eventFormat === 'in-person',
      validation: (rule) => rule.max(120),
    }),
    defineField({
      name: 'onlineInformationUrl',
      title: 'Public Online Event or Information URL',
      type: 'url',
      group: 'event',
      description: 'Do not submit a private meeting link.',
      hidden: ({document}) => document?.eventFormat === 'in-person',
      validation: (rule) => rule.uri({scheme: ['http', 'https']}),
    }),
    defineField({
      name: 'accessibilityInformation',
      title: 'Accessibility Information',
      type: 'text',
      rows: 3,
      group: 'event',
      validation: (rule) => rule.max(1000),
    }),
    defineField({
      name: 'transportInformation',
      title: 'Transport or Parking Information',
      type: 'text',
      rows: 3,
      group: 'event',
      hidden: ({document}) => document?.eventFormat === 'online',
      validation: (rule) => rule.max(1000),
    }),
    defineField({
      name: 'intendedAudience',
      title: 'Intended Audience',
      type: 'string',
      group: 'event',
      validation: (rule) => rule.max(300),
    }),
    defineField({
      name: 'sourceUrl',
      title: 'Original Event or Public Source URL',
      type: 'url',
      group: 'event',
      validation: (rule) => rule.uri({scheme: ['http', 'https']}),
    }),

    defineField({
      name: 'registrationRequirement',
      title: 'Registration Requirement',
      type: 'string',
      group: 'registration',
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
      group: 'registration',
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
      validation: (rule) =>
        rule.required().custom((value, context) => {
          const requirement = context.document?.registrationRequirement

          if (requirement === 'not-required') {
            return value === 'not-applicable'
              ? true
              : 'Registration status must be Not applicable when registration is not required.'
          }

          return value === 'not-applicable'
            ? 'Select the current registration status.'
            : true
        }),
    }),
    defineField({
      name: 'registrationUrl',
      title: 'External Registration or Ticket URL',
      type: 'url',
      group: 'registration',
      hidden: ({document}) => document?.registrationRequirement === 'not-required',
      validation: (rule) => rule.uri({scheme: ['http', 'https']}),
    }),
    defineField({
      name: 'registrationDeadline',
      title: 'Registration Deadline',
      type: 'datetime',
      group: 'registration',
      hidden: ({document}) => document?.registrationRequirement === 'not-required',
    }),
    defineField({
      name: 'isFree',
      title: 'Free Event',
      type: 'boolean',
      group: 'registration',
      initialValue: true,
    }),
    defineField({
      name: 'priceDescription',
      title: 'Price Description',
      type: 'string',
      group: 'registration',
      hidden: ({document}) => document?.isFree !== false,
      validation: (rule) => rule.max(300),
    }),

    defineField({
      name: 'proposedImageUrl',
      title: 'Proposed Image URL',
      type: 'url',
      group: 'image',
      description: 'Initial version accepts a public image or organizer page URL, not a direct file upload.',
      validation: (rule) => rule.uri({scheme: ['http', 'https']}),
    }),
    defineField({
      name: 'imageAltSuggestion',
      title: 'Suggested Alternative Text',
      type: 'string',
      group: 'image',
      validation: (rule) => rule.max(300),
    }),
    defineField({
      name: 'imageCredit',
      title: 'Image Credit',
      type: 'string',
      group: 'image',
      validation: (rule) => rule.max(200),
    }),
    defineField({
      name: 'imagePermissionConfirmed',
      title: 'Image Publication Permission Confirmed',
      type: 'boolean',
      group: 'image',
      initialValue: false,
      validation: (rule) =>
        rule.custom((value, context) =>
          context.document?.proposedImageUrl && value !== true
            ? 'Image publication permission must be confirmed when an image URL is proposed.'
            : true,
        ),
    }),

    defineField({
      name: 'authorityConfirmed',
      title: 'Authority to Submit Confirmed',
      type: 'boolean',
      group: 'declarations',
      validation: (rule) => rule.required().custom((value) => value === true || 'Confirmation is required.'),
    }),
    defineField({
      name: 'accuracyConfirmed',
      title: 'Information Accuracy Confirmed',
      type: 'boolean',
      group: 'declarations',
      validation: (rule) => rule.required().custom((value) => value === true || 'Confirmation is required.'),
    }),
    defineField({
      name: 'editingTranslationAccepted',
      title: 'Editorial Editing and Translation Accepted',
      type: 'boolean',
      group: 'declarations',
      validation: (rule) => rule.required().custom((value) => value === true || 'Confirmation is required.'),
    }),
    defineField({
      name: 'publicationNotGuaranteedAccepted',
      title: 'No Publication Guarantee Accepted',
      type: 'boolean',
      group: 'declarations',
      validation: (rule) => rule.required().custom((value) => value === true || 'Confirmation is required.'),
    }),
    defineField({
      name: 'privacyRetentionAccepted',
      title: 'Privacy and Retention Notice Accepted',
      type: 'boolean',
      group: 'declarations',
      validation: (rule) => rule.required().custom((value) => value === true || 'Confirmation is required.'),
    }),
  ],

  orderings: [
    {
      title: 'Newest submissions first',
      name: 'submittedAtDesc',
      by: [{field: 'submittedAt', direction: 'desc'}],
    },
    {
      title: 'Event date, soonest first',
      name: 'eventDateAsc',
      by: [{field: 'startDateTime', direction: 'asc'}],
    },
  ],

  preview: {
    select: {
      title: 'proposedTitle',
      organizerName: 'organizerName',
      moderationStatus: 'moderationStatus',
      submittedAt: 'submittedAt',
      startDateTime: 'startDateTime',
      formInterfaceLanguage: 'formInterfaceLanguage',
    },
    prepare({
      title,
      organizerName,
      moderationStatus,
      submittedAt,
      startDateTime,
      formInterfaceLanguage,
    }) {
      const submitted = submittedAt
        ? new Date(submittedAt).toLocaleString('en-GB')
        : 'Submission time missing'
      const eventDate = startDateTime
        ? new Date(startDateTime).toLocaleString('en-GB')
        : 'Event date missing'

      return {
        title: title || 'Untitled Event submission',
        subtitle: `${moderationStatus || 'new'} · ${organizerName || 'Unknown organizer'} · Event ${eventDate} · Submitted ${submitted} · ${formInterfaceLanguage || 'unknown language'}`,
      }
    },
  },
})
