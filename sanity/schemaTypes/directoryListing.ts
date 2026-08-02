import {defineArrayMember, defineField, defineType} from 'sanity'

const countyOptions = [
  {title: 'Agder', value: 'agder'},
  {title: 'Akershus', value: 'akershus'},
  {title: 'Buskerud', value: 'buskerud'},
  {title: 'Finnmark', value: 'finnmark'},
  {title: 'Innlandet', value: 'innlandet'},
  {title: 'Møre og Romsdal', value: 'more-og-romsdal'},
  {title: 'Nordland', value: 'nordland'},
  {title: 'Oslo', value: 'oslo'},
  {title: 'Rogaland', value: 'rogaland'},
  {title: 'Telemark', value: 'telemark'},
  {title: 'Troms', value: 'troms'},
  {title: 'Trøndelag', value: 'trondelag'},
  {title: 'Vestfold', value: 'vestfold'},
  {title: 'Vestland', value: 'vestland'},
  {title: 'Østfold', value: 'ostfold'},
]

const physicalPresence = (document: Record<string, unknown> | undefined) =>
  document?.presenceType === 'physical' || document?.presenceType === 'physical-and-online'

export const directoryListing = defineType({
  name: 'directoryListing',
  title: 'Community Directory Listing',
  type: 'document',
  groups: [
    {name: 'identity', title: 'Identity and Language', default: true},
    {name: 'classification', title: 'Type and Category'},
    {name: 'connection', title: 'Nepal and Nepali Connection'},
    {name: 'content', title: 'Public Description'},
    {name: 'contact', title: 'Public Contact'},
    {name: 'location', title: 'Location and Coverage'},
    {name: 'media', title: 'Images and Links'},
    {name: 'review', title: 'Verification and Publication'},
  ],
  fields: [
    defineField({
      name: 'name',
      title: 'Public Listing Name',
      type: 'string',
      group: 'identity',
      validation: (rule) => rule.required().min(2).max(160),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'identity',
      options: {source: 'name', maxLength: 96},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'language',
      title: 'Public Content Language',
      type: 'string',
      group: 'identity',
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
      group: 'identity',
      to: [{type: 'directoryListing'}],
      options: {
        filter: ({document}) =>
          document?.language === 'ne'
            ? {filter: 'language == $language', params: {language: 'nb'}}
            : document?.language === 'nb'
              ? {filter: 'language == $language', params: {language: 'ne'}}
              : {},
      },
      validation: (rule) =>
        rule.custom((translation, context) => {
          if (!translation?._ref) return true
          return context.document?._id?.replace(/^drafts\./, '') ===
            translation._ref.replace(/^drafts\./, '')
            ? 'A listing cannot reference itself as its translation.'
            : true
        }),
    }),
    defineField({
      name: 'listingType',
      title: 'Listing Type',
      type: 'string',
      group: 'classification',
      options: {
        list: [
          {title: 'Business', value: 'business'},
          {title: 'Professional Service', value: 'professional-service'},
          {title: 'Organization or Association', value: 'organization-association'},
          {title: 'NGO or Charity', value: 'ngo-charity'},
          {title: 'Community Group', value: 'community-group'},
          {title: 'Public-interest Service', value: 'public-interest-service'},
          {title: 'Website or Digital Resource', value: 'website-digital-resource'},
          {title: 'Other', value: 'other'},
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'otherListingType',
      title: 'Other Listing Type',
      type: 'string',
      group: 'classification',
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
      group: 'classification',
      options: {
        list: [
          {title: 'Food, Restaurants and Catering', value: 'food-restaurants-catering'},
          {title: 'Groceries and Retail', value: 'groceries-retail'},
          {title: 'Legal Services', value: 'legal-services'},
          {title: 'Accounting, Tax and Finance', value: 'accounting-tax-finance'},
          {title: 'Cleaning and Household Services', value: 'cleaning-household-services'},
          {title: 'Construction, Repair and Property', value: 'construction-repair-property'},
          {title: 'Health and Wellbeing', value: 'health-wellbeing'},
          {title: 'Education, Language and Training', value: 'education-language-training'},
          {title: 'Travel and Tourism', value: 'travel-tourism'},
          {title: 'Transport Services', value: 'transport-services'},
          {title: 'Logistics and Delivery', value: 'logistics-delivery'},
          {title: 'Technology and IT', value: 'technology-it'},
          {title: 'Media and Communication', value: 'media-communication'},
          {title: 'Beauty and Personal Services', value: 'beauty-personal-services'},
          {title: 'Culture and Community', value: 'culture-community'},
          {title: 'Children, Youth and Family', value: 'children-youth-family'},
          {title: 'Sports and Recreation', value: 'sports-recreation'},
          {title: 'Religious and Traditional', value: 'religious-traditional'},
          {title: 'Charity, Volunteering and Support', value: 'charity-volunteering-support'},
          {title: 'Business and Professional Networks', value: 'business-professional-networks'},
          {
            title: 'Information Websites and Digital Resources',
            value: 'information-websites-digital-resources',
          },
          {title: 'Other', value: 'other'},
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'otherCategory',
      title: 'Other Category',
      type: 'string',
      group: 'classification',
      hidden: ({document}) => document?.primaryCategory !== 'other',
      validation: (rule) =>
        rule.custom((value, context) =>
          context.document?.primaryCategory === 'other' && !value
            ? 'Describe the other category.'
            : true,
        ),
    }),
    defineField({
      name: 'communityConnections',
      title: 'Approved Nepal and Nepali Connections',
      type: 'array',
      group: 'connection',
      description: 'Publish only reviewed connections. Never infer ownership or background.',
      of: [defineArrayMember({type: 'string'})],
      options: {
        list: [
          {title: 'Nepali-owned (wholly or majority)', value: 'majority-nepali-owned'},
          {title: 'Partly Nepali-owned', value: 'partly-nepali-owned'},
          {title: 'Nepali-founded', value: 'nepali-founded'},
          {title: 'Nepali-led', value: 'nepali-led'},
          {title: 'Nepal-related Organization', value: 'nepal-related-organization'},
          {title: 'Nepali-language Service Available', value: 'nepali-language-service'},
          {title: 'Nepali Products, Food or Culture', value: 'nepali-products-food-culture'},
          {title: 'Serves the Nepali Community', value: 'serves-nepali-community'},
          {title: 'Works with Nepal', value: 'works-with-nepal'},
          {title: 'Nepal-based and Serving Norway', value: 'nepal-based-serving-norway'},
          {title: 'Relevant Digital Resource', value: 'relevant-digital-resource'},
          {title: 'Other Reviewed Connection', value: 'other'},
        ],
        layout: 'grid',
      },
      validation: (rule) => rule.required().min(1).unique(),
    }),
    defineField({
      name: 'connectionExplanation',
      title: 'Public Connection Explanation',
      type: 'text',
      rows: 3,
      group: 'connection',
      validation: (rule) => rule.required().min(20).max(500),
    }),
    defineField({
      name: 'serviceLanguages',
      title: 'Public Service Languages',
      type: 'array',
      group: 'connection',
      of: [defineArrayMember({type: 'string'})],
      options: {
        list: [
          {title: 'Nepali', value: 'nepali'},
          {title: 'Norwegian', value: 'norwegian'},
          {title: 'English', value: 'english'},
          {title: 'Other', value: 'other'},
        ],
        layout: 'grid',
      },
      validation: (rule) => rule.required().min(1).unique(),
    }),
    defineField({
      name: 'otherServiceLanguages',
      title: 'Other Service Languages',
      type: 'array',
      group: 'connection',
      of: [
        defineArrayMember({
          type: 'string',
          validation: (rule) => rule.required().min(2).max(80),
        }),
      ],
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
      title: 'Short Summary',
      type: 'text',
      rows: 4,
      group: 'content',
      validation: (rule) => rule.required().min(30).max(350),
    }),
    defineField({
      name: 'description',
      title: 'Full Public Description',
      type: 'array',
      group: 'content',
      of: [defineArrayMember({type: 'block'})],
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: 'organizationNumber',
      title: 'Norwegian Organization Number',
      type: 'string',
      group: 'contact',
      validation: (rule) =>
        rule.custom((value) =>
          !value || /^\d{9}$/.test(value.replace(/\s/g, ''))
            ? true
            : 'Enter a valid nine-digit Norwegian organization number.',
        ),
    }),
    defineField({
      name: 'website',
      title: 'Public Website',
      type: 'url',
      group: 'contact',
      validation: (rule) =>
        rule
          .uri({scheme: ['http', 'https']})
          .custom((value, context) =>
            context.document?.listingType === 'website-digital-resource' && !value
              ? 'A website or digital-resource listing requires a public website.'
              : true,
          ),
    }),
    defineField({name: 'publicEmail', title: 'Public Email', type: 'email', group: 'contact'}),
    defineField({
      name: 'publicPhone',
      title: 'Public Telephone',
      type: 'string',
      group: 'contact',
      validation: (rule) => rule.max(40),
    }),
    defineField({
      name: 'publicContactRole',
      title: 'Public Contact Name or Role',
      type: 'string',
      group: 'contact',
      description: 'Publish only with explicit permission and staff review.',
      validation: (rule) => rule.max(120),
    }),
    defineField({
      name: 'presenceType',
      title: 'Public Presence',
      type: 'string',
      group: 'location',
      options: {
        list: [
          {title: 'Physical Location', value: 'physical'},
          {title: 'Online Only', value: 'online-only'},
          {title: 'Physical and Online', value: 'physical-and-online'},
          {title: 'No Public Visiting Location', value: 'no-public-location'},
        ],
        layout: 'radio',
      },
      initialValue: 'physical',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'country',
      title: 'Country',
      type: 'string',
      group: 'location',
      initialValue: 'Norway',
      hidden: ({document}) => !physicalPresence(document),
      validation: (rule) =>
        rule.custom((value, context) =>
          physicalPresence(context.document) && !value
            ? 'A physical listing requires a country.'
            : true,
        ),
    }),
    defineField({
      name: 'county',
      title: 'County (Fylke)',
      type: 'string',
      group: 'location',
      options: {list: countyOptions},
      hidden: ({document}) => !physicalPresence(document),
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
        rule
          .max(120)
          .custom((value, context) =>
            physicalPresence(context.document) && !value
              ? 'A physical listing requires a city or locality.'
              : true,
          ),
    }),
    defineField({
      name: 'streetAddress',
      title: 'Public Street Address',
      type: 'string',
      group: 'location',
      description:
        'Never publish a private home address without explicit justification and permission.',
      hidden: ({document}) => !physicalPresence(document),
      validation: (rule) => rule.max(200),
    }),
    defineField({
      name: 'postalCode',
      title: 'Postal Code',
      type: 'string',
      group: 'location',
      hidden: ({document}) => !physicalPresence(document),
      validation: (rule) =>
        rule.custom((value) =>
          !value || /^\d{4}$/.test(value)
            ? true
            : 'Enter a valid four-digit Norwegian postal code.',
        ),
    }),
    defineField({
      name: 'mapUrl',
      title: 'Public Map URL',
      type: 'url',
      group: 'location',
      hidden: ({document}) => !physicalPresence(document),
      validation: (rule) => rule.uri({scheme: ['http', 'https']}),
    }),
    defineField({
      name: 'coverageModes',
      title: 'Service Coverage',
      type: 'array',
      group: 'location',
      of: [defineArrayMember({type: 'string'})],
      options: {
        list: [
          {title: 'Local Area', value: 'local-area'},
          {title: 'Selected Municipalities', value: 'selected-municipalities'},
          {title: 'Selected Counties', value: 'selected-counties'},
          {title: 'Nationwide in Norway', value: 'nationwide-norway'},
          {title: 'Online throughout Norway', value: 'online-norway'},
          {title: 'Norway and Nepal', value: 'norway-and-nepal'},
          {title: 'Nepal', value: 'nepal'},
          {title: 'International', value: 'international'},
          {title: 'Other', value: 'other'},
        ],
        layout: 'grid',
      },
      validation: (rule) => rule.required().min(1).unique(),
    }),
    defineField({
      name: 'serviceCounties',
      title: 'Selected Service Counties',
      type: 'array',
      group: 'location',
      of: [defineArrayMember({type: 'string'})],
      options: {list: countyOptions, layout: 'grid'},
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
      of: [
        defineArrayMember({
          type: 'string',
          validation: (rule) => rule.required().min(2).max(120),
        }),
      ],
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
      name: 'logo',
      title: 'Logo',
      type: 'image',
      group: 'media',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: 'Alternative Text',
          type: 'string',
          validation: (rule) => rule.required().max(200),
        }),
      ],
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      group: 'media',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: 'Alternative Text',
          type: 'string',
          validation: (rule) => rule.required().max(250),
        }),
        defineField({
          name: 'caption',
          title: 'Caption',
          type: 'string',
          validation: (rule) => rule.max(300),
        }),
        defineField({
          name: 'credit',
          title: 'Image Credit',
          type: 'string',
          validation: (rule) => rule.max(200),
        }),
      ],
    }),
    defineField({
      name: 'facebookUrl',
      title: 'Facebook URL',
      type: 'url',
      group: 'media',
      validation: (rule) => rule.uri({scheme: ['http', 'https']}),
    }),
    defineField({
      name: 'instagramUrl',
      title: 'Instagram URL',
      type: 'url',
      group: 'media',
      validation: (rule) => rule.uri({scheme: ['http', 'https']}),
    }),
    defineField({
      name: 'linkedInUrl',
      title: 'LinkedIn URL',
      type: 'url',
      group: 'media',
      validation: (rule) => rule.uri({scheme: ['http', 'https']}),
    }),
    defineField({
      name: 'verificationScopes',
      title: 'Verification Scope',
      type: 'array',
      group: 'review',
      description: 'Record only checks actually completed. Verification is not an endorsement.',
      of: [defineArrayMember({type: 'string'})],
      options: {
        list: [
          {title: 'Entity Identity Checked', value: 'entity-identity'},
          {title: 'Organization Number Checked', value: 'organization-number'},
          {title: 'Public Contact Details Checked', value: 'public-contact'},
          {title: 'Community Connection Reviewed', value: 'community-connection'},
          {title: 'Website or Representative Authority Checked', value: 'website-authority'},
          {title: 'Regulated Professional Claim Checked', value: 'professional-claim'},
        ],
        layout: 'grid',
      },
      validation: (rule) =>
        rule.unique().custom((value, context) => {
          if (context.document?.isVerified && (!Array.isArray(value) || value.length === 0)) {
            return 'Select at least one completed verification check before showing Verified status.'
          }

          if (
            Array.isArray(value) &&
            value.includes('organization-number') &&
            !context.document?.organizationNumber
          ) {
            return 'Add an organization number before recording that it was checked.'
          }

          return true
        }),
    }),
    defineField({
      name: 'isVerified',
      title: 'Show Verified Status',
      type: 'boolean',
      group: 'review',
      description: 'This is not an endorsement.',
      initialValue: false,
    }),
    defineField({
      name: 'lastVerifiedAt',
      title: 'Last Verified At',
      type: 'date',
      group: 'review',
      validation: (rule) =>
        rule.custom((value, context) => {
          if (
            (context.document?.isVerified || context.document?.listingStatus === 'active') &&
            !value
          ) {
            return 'Verified and Active listings require a Last Verified At date.'
          }

          return true
        }),
    }),
    defineField({
      name: 'nextReviewAt',
      title: 'Next Review Due',
      type: 'date',
      group: 'review',
      validation: (rule) =>
        rule.custom((value, context) => {
          if (context.document?.listingStatus === 'active' && !value) {
            return 'Active listings require a Next Review Due date.'
          }

          const lastVerifiedAt = context.document?.lastVerifiedAt

          if (
            value &&
            typeof lastVerifiedAt === 'string' &&
            new Date(value) < new Date(lastVerifiedAt)
          ) {
            return 'Next Review Due cannot be earlier than Last Verified At.'
          }

          return true
        }),
    }),
    defineField({
      name: 'editorialReviewer',
      title: 'Editorial Reviewer',
      type: 'string',
      group: 'review',
      validation: (rule) => rule.required().min(2).max(120),
    }),
    defineField({
      name: 'listingStatus',
      title: 'Listing Status',
      type: 'string',
      group: 'review',
      options: {
        list: [
          {title: 'Draft', value: 'draft'},
          {title: 'Active', value: 'active'},
          {title: 'Needs Review', value: 'needs-review'},
          {title: 'Temporarily Closed', value: 'temporarily-closed'},
          {title: 'Permanently Closed', value: 'permanently-closed'},
          {title: 'Suspended', value: 'suspended'},
          {title: 'Expired', value: 'expired'},
          {title: 'Archived', value: 'archived'},
        ],
        layout: 'radio',
      },
      initialValue: 'draft',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'statusExplanation',
      title: 'Public Status Explanation',
      type: 'text',
      rows: 3,
      group: 'review',
      description:
        'Required for temporarily or permanently closed listings. Explain the reviewed public status without exposing private reporter information.',
      hidden: ({document}) =>
        !['temporarily-closed', 'permanently-closed'].includes(String(document?.listingStatus)),
      validation: (rule) =>
        rule
          .max(500)
          .custom((value, context) =>
            ['temporarily-closed', 'permanently-closed'].includes(
              String(context.document?.listingStatus),
            ) && !value
              ? 'Closed listings require a public status explanation.'
              : true,
          ),
    }),
    defineField({
      name: 'statusEffectiveAt',
      title: 'Status Effective Date',
      type: 'date',
      group: 'review',
      hidden: ({document}) =>
        !['temporarily-closed', 'permanently-closed'].includes(String(document?.listingStatus)),
      validation: (rule) =>
        rule.custom((value, context) =>
          ['temporarily-closed', 'permanently-closed'].includes(
            String(context.document?.listingStatus),
          ) && !value
            ? 'Closed listings require a status effective date.'
            : true,
        ),
    }),
    defineField({
      name: 'isFeatured',
      title: 'Feature on Homepage',
      type: 'boolean',
      group: 'review',
      description:
        'Editorial placement only. Featured does not mean Verified, recommended, or sponsored.',
      initialValue: false,
      validation: (rule) =>
        rule.custom((value, context) =>
          value && context.document?.listingStatus !== 'active'
            ? 'Only Active listings may be featured.'
            : true,
        ),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      group: 'review',
      validation: (rule) =>
        rule.custom((value, context) =>
          context.document?.listingStatus === 'active' && !value
            ? 'Active listings require a publication time.'
            : true,
        ),
    }),
  ],
  orderings: [
    {title: 'Name, A to Z', name: 'nameAsc', by: [{field: 'name', direction: 'asc'}]},
    {
      title: 'Recently Verified',
      name: 'lastVerifiedDesc',
      by: [{field: 'lastVerifiedAt', direction: 'desc'}],
    },
    {
      title: 'Newest Published',
      name: 'publishedAtDesc',
      by: [{field: 'publishedAt', direction: 'desc'}],
    },
  ],
  preview: {
    select: {
      title: 'name',
      type: 'listingType',
      category: 'primaryCategory',
      city: 'city',
      county: 'county',
      status: 'listingStatus',
      verified: 'isVerified',
      media: 'logo',
    },
    prepare({title, type, category, city, county, status, verified, media}) {
      return {
        title,
        subtitle: `${verified ? 'Verified · ' : ''}${type || 'No type'} · ${category || 'No category'} · ${city || county || 'No public location'} · ${status || 'draft'}`,
        media,
      }
    },
  },
})
