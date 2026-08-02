import {defineField, defineType} from 'sanity'

const moderationStatuses = [
  {title: 'New', value: 'new'},
  {title: 'Under review', value: 'under-review'},
  {title: 'More information requested', value: 'more-information-requested'},
  {title: 'Approved', value: 'approved'},
  {title: 'Converted to public listing', value: 'converted'},
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

const submissionLanguages = [...interfaceLanguages, {title: 'Other', value: 'other'}]
const publicOutputPreferences = [
  {title: 'Nepali public page', value: 'ne'},
  {title: 'Norwegian public page', value: 'nb'},
  {title: 'Both Nepali and Norwegian public pages', value: 'both'},
  {title: 'No preference - nepali.no may decide', value: 'editorial-decision'},
]

const relationships = [
  {title: 'Owner or authorized representative', value: 'owner-authorized-representative'},
  {title: 'Founder or leader', value: 'founder-leader'},
  {title: 'Employee or volunteer', value: 'employee-volunteer'},
  {title: 'Website or resource administrator', value: 'website-administrator'},
  {title: 'Community member or visitor suggesting a listing', value: 'community-member'},
  {title: 'Other', value: 'other'},
]

const listingTypes = [
  {title: 'Business', value: 'business'},
  {title: 'Professional Service', value: 'professional-service'},
  {title: 'Organization or Association', value: 'organization-association'},
  {title: 'NGO or Charity', value: 'ngo-charity'},
  {title: 'Community Group', value: 'community-group'},
  {title: 'Public-interest Service', value: 'public-interest-service'},
  {title: 'Website or Digital Resource', value: 'website-digital-resource'},
  {title: 'Other', value: 'other'},
]

const categories = [
  ['Food, Restaurants and Catering', 'food-restaurants-catering'],
  ['Groceries and Retail', 'groceries-retail'],
  ['Legal Services', 'legal-services'],
  ['Accounting, Tax and Finance', 'accounting-tax-finance'],
  ['Cleaning and Household Services', 'cleaning-household-services'],
  ['Construction, Repair and Property', 'construction-repair-property'],
  ['Health and Wellbeing', 'health-wellbeing'],
  ['Education, Language and Training', 'education-language-training'],
  ['Travel and Tourism', 'travel-tourism'],
  ['Transport Services', 'transport-services'],
  ['Logistics and Delivery', 'logistics-delivery'],
  ['Technology and IT', 'technology-it'],
  ['Media and Communication', 'media-communication'],
  ['Beauty and Personal Services', 'beauty-personal-services'],
  ['Culture and Community', 'culture-community'],
  ['Children, Youth and Family', 'children-youth-family'],
  ['Sports and Recreation', 'sports-recreation'],
  ['Religious and Traditional', 'religious-traditional'],
  ['Charity, Volunteering and Support', 'charity-volunteering-support'],
  ['Business and Professional Networks', 'business-professional-networks'],
  ['Information Websites and Digital Resources', 'information-websites-digital-resources'],
  ['Other', 'other'],
].map(([title, value]) => ({title, value}))

const connections = [
  ['Majority Nepali-owned', 'majority-nepali-owned'],
  ['Partly Nepali-owned', 'partly-nepali-owned'],
  ['Nepali-founded', 'nepali-founded'],
  ['Nepali-led', 'nepali-led'],
  ['Nepal-related organization', 'nepal-related-organization'],
  ['Nepali-language service', 'nepali-language-service'],
  ['Nepali products, food or culture', 'nepali-products-food-culture'],
  ['Serves the Nepali community', 'serves-nepali-community'],
  ['Works with Nepal', 'works-with-nepal'],
  ['Nepal-based and serving Norway', 'nepal-based-serving-norway'],
  ['Relevant digital resource', 'relevant-digital-resource'],
  ['Other', 'other'],
].map(([title, value]) => ({title, value}))

const serviceLanguages = [
  {title: 'Nepali', value: 'nepali'},
  {title: 'Norwegian', value: 'norwegian'},
  {title: 'English', value: 'english'},
  {title: 'Other', value: 'other'},
]

const presenceTypes = [
  {title: 'Physical Location', value: 'physical'},
  {title: 'Online Only', value: 'online-only'},
  {title: 'Physical and Online', value: 'physical-and-online'},
  {title: 'No Public Visiting Location', value: 'no-public-location'},
]

const counties = [
  ['Agder', 'agder'],
  ['Akershus', 'akershus'],
  ['Buskerud', 'buskerud'],
  ['Finnmark', 'finnmark'],
  ['Innlandet', 'innlandet'],
  ['Møre og Romsdal', 'more-og-romsdal'],
  ['Nordland', 'nordland'],
  ['Oslo', 'oslo'],
  ['Rogaland', 'rogaland'],
  ['Telemark', 'telemark'],
  ['Troms', 'troms'],
  ['Trøndelag', 'trondelag'],
  ['Vestfold', 'vestfold'],
  ['Vestland', 'vestland'],
  ['Østfold', 'ostfold'],
].map(([title, value]) => ({title, value}))

const coverageModes = [
  ['Local Area', 'local-area'],
  ['Selected Municipalities', 'selected-municipalities'],
  ['Selected Counties', 'selected-counties'],
  ['Nationwide in Norway', 'nationwide-norway'],
  ['Online throughout Norway', 'online-norway'],
  ['Norway and Nepal', 'norway-and-nepal'],
  ['Nepal', 'nepal'],
  ['International', 'international'],
  ['Other', 'other'],
].map(([title, value]) => ({title, value}))

const physicalPresence = (document: Record<string, unknown> | undefined) =>
  document?.presenceType === 'physical' || document?.presenceType === 'physical-and-online'

export const directoryListingSubmission = defineType({
  name: 'directoryListingSubmission',
  title: 'Community Directory Submission',
  type: 'document',
  description:
    'Private application for moderation. It must never publish automatically as a public Directory listing.',
  groups: [
    {name: 'moderation', title: 'Moderation', default: true},
    {name: 'applicant', title: 'Private Applicant Contact'},
    {name: 'authority', title: 'Authority and Relationship'},
    {name: 'identity', title: 'Proposed Listing Identity'},
    {name: 'connection', title: 'Community Connection'},
    {name: 'description', title: 'Proposed Public Description'},
    {name: 'publicContact', title: 'Proposed Public Contact'},
    {name: 'location', title: 'Location and Service Coverage'},
    {name: 'links', title: 'Links and Images'},
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
      description: 'Set by the secure server endpoint.',
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
            ? 'Specify the submission language.'
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
      description: 'Private staff notes. Never publish or copy automatically.',
    }),
    defineField({
      name: 'clarificationNotes',
      title: 'Clarification and Follow-up Notes',
      type: 'text',
      rows: 5,
      group: 'moderation',
    }),
    defineField({
      name: 'retentionReviewDate',
      title: 'Retention Review Date',
      type: 'date',
      group: 'moderation',
    }),
    defineField({
      name: 'convertedListingIds',
      title: 'Public Directory Document IDs',
      type: 'array',
      group: 'moderation',
      description: 'Store final public IDs after conversion. No cross-dataset references.',
      of: [{type: 'string'}],
      validation: (rule) => rule.unique().max(2),
    }),
    defineField({
      name: 'convertedListingUrls',
      title: 'Public Directory URLs',
      type: 'array',
      group: 'moderation',
      of: [{type: 'url', validation: (rule) => rule.uri({scheme: ['http', 'https']})}],
      validation: (rule) => rule.unique().max(2),
    }),
    defineField({
      name: 'convertedAt',
      title: 'Converted At',
      type: 'datetime',
      group: 'moderation',
    }),

    defineField({
      name: 'applicantName',
      title: 'Private Applicant Name',
      type: 'string',
      group: 'applicant',
      validation: (rule) => rule.required().min(2).max(120),
    }),
    defineField({
      name: 'applicantEmail',
      title: 'Private Applicant Email',
      type: 'email',
      group: 'applicant',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'applicantPhone',
      title: 'Private Applicant Telephone',
      type: 'string',
      group: 'applicant',
      validation: (rule) => rule.max(40),
    }),
    defineField({
      name: 'preferredContactLanguage',
      title: 'Preferred Contact Language',
      type: 'string',
      group: 'applicant',
      options: {list: submissionLanguages, layout: 'radio'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'otherPreferredContactLanguage',
      title: 'Other Preferred Contact Language',
      type: 'string',
      group: 'applicant',
      hidden: ({document}) => document?.preferredContactLanguage !== 'other',
      validation: (rule) =>
        rule.custom((value, context) =>
          context.document?.preferredContactLanguage === 'other' && !value
            ? 'Specify the preferred contact language.'
            : true,
        ),
    }),

    defineField({
      name: 'applicantRelationship',
      title: 'Relationship to the Entity',
      type: 'string',
      group: 'authority',
      options: {list: relationships, layout: 'radio'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'otherApplicantRelationship',
      title: 'Other Relationship',
      type: 'string',
      group: 'authority',
      hidden: ({document}) => document?.applicantRelationship !== 'other',
      validation: (rule) =>
        rule.custom((value, context) =>
          context.document?.applicantRelationship === 'other' && !value
            ? 'Describe the applicant relationship.'
            : true,
        ),
    }),
    defineField({
      name: 'authorityExplanation',
      title: 'Relationship or Legitimate Basis Explanation',
      type: 'text',
      rows: 4,
      group: 'authority',
      validation: (rule) => rule.required().min(20).max(1000),
    }),

    defineField({
      name: 'proposedName',
      title: 'Proposed Public Listing Name',
      type: 'string',
      group: 'identity',
      validation: (rule) => rule.required().min(2).max(160),
    }),
    defineField({
      name: 'listingType',
      title: 'Listing Type',
      type: 'string',
      group: 'identity',
      options: {list: listingTypes},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'otherListingType',
      title: 'Other Listing Type',
      type: 'string',
      group: 'identity',
      hidden: ({document}) => document?.listingType !== 'other',
      validation: (rule) =>
        rule.custom((value, context) =>
          context.document?.listingType === 'other' && !value
            ? 'Describe the other listing type.'
            : true,
        ),
    }),
    defineField({
      name: 'primaryCategory',
      title: 'Primary Category',
      type: 'string',
      group: 'identity',
      options: {list: categories},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'otherCategory',
      title: 'Other Category',
      type: 'string',
      group: 'identity',
      hidden: ({document}) => document?.primaryCategory !== 'other',
      validation: (rule) =>
        rule.custom((value, context) =>
          context.document?.primaryCategory === 'other' && !value
            ? 'Describe the other category.'
            : true,
        ),
    }),
    defineField({
      name: 'organizationNumber',
      title: 'Norwegian Organization Number',
      type: 'string',
      group: 'identity',
      validation: (rule) =>
        rule.custom((value) =>
          !value || /^\d{9}$/.test(value.replace(/\s/g, ''))
            ? true
            : 'Use a valid nine-digit organization number.',
        ),
    }),
    defineField({
      name: 'entityExplanationWithoutOrganizationNumber',
      title: 'Entity Explanation When No Organization Number Exists',
      type: 'text',
      rows: 3,
      group: 'identity',
      hidden: ({document}) => Boolean(document?.organizationNumber),
      validation: (rule) =>
        rule.custom((value, context) =>
          !context.document?.organizationNumber && !value
            ? 'Explain the entity type and basis for inclusion.'
            : true,
        ),
    }),

    defineField({
      name: 'communityConnections',
      title: 'Declared Nepal and Nepali Connections',
      type: 'array',
      group: 'connection',
      of: [{type: 'string'}],
      options: {list: connections, layout: 'grid'},
      validation: (rule) => rule.required().min(1).unique(),
    }),
    defineField({
      name: 'connectionExplanation',
      title: 'Proposed Public Connection Explanation',
      type: 'text',
      rows: 4,
      group: 'connection',
      validation: (rule) => rule.required().min(20).max(1000),
    }),
    defineField({
      name: 'ownershipLeadershipExplanation',
      title: 'Private Ownership or Leadership Explanation',
      type: 'text',
      rows: 4,
      group: 'connection',
      description: 'Private moderation context. Never publish automatically.',
      validation: (rule) => rule.max(1500),
    }),
    defineField({
      name: 'serviceLanguages',
      title: 'Service Languages',
      type: 'array',
      group: 'connection',
      of: [{type: 'string'}],
      options: {list: serviceLanguages, layout: 'grid'},
      validation: (rule) => rule.required().min(1).unique(),
    }),
    defineField({
      name: 'otherServiceLanguages',
      title: 'Other Service Languages',
      type: 'array',
      group: 'connection',
      of: [{type: 'string', validation: (rule) => rule.required().min(2).max(80)}],
      hidden: ({document}) =>
        !Array.isArray(document?.serviceLanguages) || !document.serviceLanguages.includes('other'),
      validation: (rule) =>
        rule
          .unique()
          .max(10)
          .custom((value, context) =>
            Array.isArray(context.document?.serviceLanguages) &&
            context.document.serviceLanguages.includes('other') &&
            (!Array.isArray(value) || value.length === 0)
              ? 'Add at least one other service language.'
              : true,
          ),
    }),

    defineField({
      name: 'summary',
      title: 'Proposed Short Summary',
      type: 'text',
      rows: 4,
      group: 'description',
      validation: (rule) => rule.required().min(30).max(600),
    }),
    defineField({
      name: 'descriptionPlainText',
      title: 'Proposed Full Description',
      type: 'text',
      rows: 10,
      group: 'description',
      description: 'Plain source information for editorial review.',
      validation: (rule) => rule.required().min(80).max(10000),
    }),

    defineField({
      name: 'publicWebsite',
      title: 'Proposed Public Website',
      type: 'url',
      group: 'publicContact',
      validation: (rule) =>
        rule
          .uri({scheme: ['http', 'https']})
          .custom((value, context) =>
            context.document?.listingType === 'website-digital-resource' && !value
              ? 'A website or digital-resource submission requires a public website.'
              : true,
          ),
    }),
    defineField({
      name: 'publicEmail',
      title: 'Proposed Public Email',
      type: 'email',
      group: 'publicContact',
    }),
    defineField({
      name: 'publicPhone',
      title: 'Proposed Public Telephone',
      type: 'string',
      group: 'publicContact',
      validation: (rule) => rule.max(40),
    }),
    defineField({
      name: 'publicContactRole',
      title: 'Proposed Public Contact Name or Role',
      type: 'string',
      group: 'publicContact',
      validation: (rule) => rule.max(120),
    }),
    defineField({
      name: 'publicContactPermission',
      title: 'Permission to Publish Proposed Public Contacts',
      type: 'boolean',
      group: 'publicContact',
      initialValue: false,
      validation: (rule) =>
        rule.custom((value, context) =>
          (context.document?.publicEmail ||
            context.document?.publicPhone ||
            context.document?.publicContactRole) &&
          value !== true
            ? 'Permission is required for proposed public contact details.'
            : true,
        ),
    }),

    defineField({
      name: 'presenceType',
      title: 'Public Presence',
      type: 'string',
      group: 'location',
      options: {list: presenceTypes, layout: 'radio'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'country',
      title: 'Country',
      type: 'string',
      group: 'location',
      hidden: ({document}) => !physicalPresence(document),
      initialValue: 'Norway',
    }),
    defineField({
      name: 'county',
      title: 'County',
      type: 'string',
      group: 'location',
      hidden: ({document}) => !physicalPresence(document),
      options: {list: counties},
    }),
    defineField({
      name: 'municipality',
      title: 'Municipality',
      type: 'string',
      group: 'location',
      hidden: ({document}) => !physicalPresence(document),
      validation: (rule) => rule.max(120),
    }),
    defineField({
      name: 'city',
      title: 'City or Locality',
      type: 'string',
      group: 'location',
      hidden: ({document}) => !physicalPresence(document),
      validation: (rule) =>
        rule.custom((value, context) =>
          physicalPresence(context.document) && !value
            ? 'A physical listing requires a city or locality.'
            : true,
        ),
    }),
    defineField({
      name: 'streetAddress',
      title: 'Proposed Public Street Address',
      type: 'string',
      group: 'location',
      hidden: ({document}) => !physicalPresence(document),
      validation: (rule) => rule.max(200),
    }),
    defineField({
      name: 'postalCode',
      title: 'Postal Code',
      type: 'string',
      group: 'location',
      hidden: ({document}) => !physicalPresence(document),
      validation: (rule) => rule.max(20),
    }),
    defineField({
      name: 'mapUrl',
      title: 'Map URL',
      type: 'url',
      group: 'location',
      hidden: ({document}) => !physicalPresence(document),
      validation: (rule) => rule.uri({scheme: ['http', 'https']}),
    }),
    defineField({
      name: 'addressPublicationPermission',
      title: 'Applicant Confirms Address Is Already Public',
      type: 'boolean',
      group: 'location',
      hidden: ({document}) => !physicalPresence(document),
      initialValue: false,
      validation: (rule) =>
        rule.custom((value, context) =>
          context.document?.streetAddress && value !== true
            ? 'Confirm that the proposed street address is already publicly presented by the entity.'
            : true,
        ),
    }),
    defineField({
      name: 'coverageModes',
      title: 'Service Coverage',
      type: 'array',
      group: 'location',
      of: [{type: 'string'}],
      options: {list: coverageModes, layout: 'grid'},
      validation: (rule) => rule.required().min(1).unique(),
    }),
    defineField({
      name: 'serviceCounties',
      title: 'Selected Service Counties',
      type: 'array',
      group: 'location',
      of: [{type: 'string'}],
      options: {list: counties, layout: 'grid'},
      hidden: ({document}) =>
        !Array.isArray(document?.coverageModes) ||
        !document.coverageModes.includes('selected-counties'),
      validation: (rule) =>
        rule
          .unique()
          .custom((value, context) =>
            Array.isArray(context.document?.coverageModes) &&
            context.document.coverageModes.includes('selected-counties') &&
            (!Array.isArray(value) || value.length === 0)
              ? 'Select at least one service county.'
              : true,
          ),
    }),
    defineField({
      name: 'serviceMunicipalities',
      title: 'Selected Service Municipalities',
      type: 'array',
      group: 'location',
      of: [{type: 'string'}],
      hidden: ({document}) =>
        !Array.isArray(document?.coverageModes) ||
        !document.coverageModes.includes('selected-municipalities'),
      validation: (rule) =>
        rule
          .unique()
          .max(50)
          .custom((value, context) =>
            Array.isArray(context.document?.coverageModes) &&
            context.document.coverageModes.includes('selected-municipalities') &&
            (!Array.isArray(value) || value.length === 0)
              ? 'Add at least one service municipality.'
              : true,
          ),
    }),
    defineField({
      name: 'otherCoverage',
      title: 'Other Service Coverage',
      type: 'string',
      group: 'location',
      hidden: ({document}) =>
        !Array.isArray(document?.coverageModes) || !document.coverageModes.includes('other'),
      validation: (rule) =>
        rule
          .max(300)
          .custom((value, context) =>
            Array.isArray(context.document?.coverageModes) &&
            context.document.coverageModes.includes('other') &&
            !value
              ? 'Describe the other service coverage.'
              : true,
          ),
    }),

    defineField({
      name: 'facebookUrl',
      title: 'Facebook URL',
      type: 'url',
      group: 'links',
      validation: (rule) => rule.uri({scheme: ['http', 'https']}),
    }),
    defineField({
      name: 'instagramUrl',
      title: 'Instagram URL',
      type: 'url',
      group: 'links',
      validation: (rule) => rule.uri({scheme: ['http', 'https']}),
    }),
    defineField({
      name: 'linkedInUrl',
      title: 'LinkedIn URL',
      type: 'url',
      group: 'links',
      validation: (rule) => rule.uri({scheme: ['http', 'https']}),
    }),
    defineField({
      name: 'proposedLogoUrl',
      title: 'Proposed Logo URL',
      type: 'url',
      group: 'links',
      description: 'Publicly accessible URL only. No direct upload.',
      validation: (rule) => rule.uri({scheme: ['http', 'https']}),
    }),
    defineField({
      name: 'proposedCoverImageUrl',
      title: 'Proposed Cover Image URL',
      type: 'url',
      group: 'links',
      description: 'Publicly accessible URL only. No direct upload.',
      validation: (rule) => rule.uri({scheme: ['http', 'https']}),
    }),
    defineField({
      name: 'imageAltSuggestion',
      title: 'Suggested Alternative Text',
      type: 'string',
      group: 'links',
      validation: (rule) => rule.max(300),
    }),
    defineField({
      name: 'imageCredit',
      title: 'Image Credit',
      type: 'string',
      group: 'links',
      validation: (rule) => rule.max(200),
    }),
    defineField({
      name: 'imagePermissionConfirmed',
      title: 'Image Publication Permission Confirmed',
      type: 'boolean',
      group: 'links',
      initialValue: false,
      validation: (rule) =>
        rule.custom((value, context) =>
          (context.document?.proposedLogoUrl || context.document?.proposedCoverImageUrl) &&
          value !== true
            ? 'Image publication permission is required.'
            : true,
        ),
    }),

    defineField({
      name: 'legitimateBasisConfirmed',
      title: 'Authority or Legitimate Basis to Suggest Confirmed',
      type: 'boolean',
      group: 'declarations',
      validation: (rule) =>
        rule.required().custom((value) => value === true || 'Confirmation is required.'),
    }),
    defineField({
      name: 'connectionClaimsConfirmed',
      title: 'Ownership and Community Connection Claims Confirmed',
      type: 'boolean',
      group: 'declarations',
      validation: (rule) =>
        rule.required().custom((value) => value === true || 'Confirmation is required.'),
    }),
    defineField({
      name: 'accuracyConfirmed',
      title: 'Information Accuracy Confirmed',
      type: 'boolean',
      group: 'declarations',
      validation: (rule) =>
        rule.required().custom((value) => value === true || 'Confirmation is required.'),
    }),
    defineField({
      name: 'editingTranslationAccepted',
      title: 'Editorial Editing and Translation Accepted',
      type: 'boolean',
      group: 'declarations',
      validation: (rule) =>
        rule.required().custom((value) => value === true || 'Confirmation is required.'),
    }),
    defineField({
      name: 'publicationNotGuaranteedAccepted',
      title: 'No Publication Guarantee Accepted',
      type: 'boolean',
      group: 'declarations',
      validation: (rule) =>
        rule.required().custom((value) => value === true || 'Confirmation is required.'),
    }),
    defineField({
      name: 'privacyRetentionAccepted',
      title: 'Privacy and Retention Notice Accepted',
      type: 'boolean',
      group: 'declarations',
      validation: (rule) =>
        rule.required().custom((value) => value === true || 'Confirmation is required.'),
    }),
  ],
  orderings: [
    {
      title: 'Newest submissions first',
      name: 'submittedAtDesc',
      by: [{field: 'submittedAt', direction: 'desc'}],
    },
  ],
  preview: {
    select: {
      title: 'proposedName',
      type: 'listingType',
      category: 'primaryCategory',
      applicant: 'applicantName',
      status: 'moderationStatus',
      submittedAt: 'submittedAt',
      language: 'formInterfaceLanguage',
    },
    prepare({title, type, category, applicant, status, submittedAt, language}) {
      const submitted = submittedAt
        ? new Date(submittedAt).toLocaleString('en-GB')
        : 'Submission time missing'
      return {
        title: title || 'Untitled Directory submission',
        subtitle: `${status || 'new'} · ${type || 'unknown type'} · ${category || 'unknown category'} · ${applicant || 'unknown applicant'} · Submitted ${submitted} · ${language || 'unknown language'}`,
      }
    },
  },
})
