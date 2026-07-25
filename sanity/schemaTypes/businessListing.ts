import {defineField, defineType} from 'sanity'

export const businessListing = defineType({
  name: 'businessListing',
  title: 'Business Listing',
  type: 'document',

  fields: [
    defineField({
      name: 'businessName',
      title: 'Business Name',
      type: 'string',
      validation: (rule) => rule.required().min(2).max(120),
    }),

    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'The URL-friendly identifier for this business.',
      options: {
        source: 'businessName',
        maxLength: 96,
      },
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'category',
      title: 'Business Category',
      type: 'string',
      options: {
        list: [
          {title: 'Restaurant and Catering', value: 'restaurant-catering'},
          {title: 'Grocery and Retail', value: 'grocery-retail'},
          {title: 'Travel and Tourism', value: 'travel-tourism'},
          {title: 'Accounting and Finance', value: 'accounting-finance'},
          {title: 'Legal Services', value: 'legal-services'},
          {title: 'Technology and IT', value: 'technology-it'},
          {title: 'Education and Training', value: 'education-training'},
          {title: 'Health and Wellness', value: 'health-wellness'},
          {title: 'Beauty and Personal Care', value: 'beauty-personal-care'},
          {title: 'Construction and Maintenance', value: 'construction-maintenance'},
          {title: 'Transport and Logistics', value: 'transport-logistics'},
          {title: 'Media and Entertainment', value: 'media-entertainment'},
          {title: 'Community Organization', value: 'community-organization'},
          {title: 'Other', value: 'other'},
        ],
      },
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'shortDescription',
      title: 'Short Description',
      type: 'text',
      rows: 4,
      description:
        'A short introduction displayed on business cards and directory pages.',
      validation: (rule) => rule.required().min(30).max(300),
    }),

    defineField({
      name: 'description',
      title: 'Full Description',
      type: 'array',
      of: [{type: 'block'}],
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'organizationNumber',
      title: 'Norwegian Organization Number',
      type: 'string',
      description: 'Optional nine-digit organization number.',
      validation: (rule) =>
        rule.custom((value) => {
          if (!value) {
            return true
          }

          const normalizedValue = value.replace(/\s/g, '')

          return /^\d{9}$/.test(normalizedValue)
            ? true
            : 'Enter a valid nine-digit Norwegian organization number.'
        }),
    }),

    defineField({
      name: 'contactPerson',
      title: 'Contact Person',
      type: 'string',
    }),

    defineField({
      name: 'email',
      title: 'Email Address',
      type: 'email',
    }),

    defineField({
      name: 'phone',
      title: 'Phone Number',
      type: 'string',
    }),

    defineField({
      name: 'website',
      title: 'Website',
      type: 'url',
      validation: (rule) =>
        rule.uri({
          scheme: ['http', 'https'],
        }),
    }),

    defineField({
      name: 'address',
      title: 'Street Address',
      type: 'string',
    }),

    defineField({
      name: 'postalCode',
      title: 'Postal Code',
      type: 'string',
      validation: (rule) =>
        rule.custom((value) => {
          if (!value) {
            return true
          }

          return /^\d{4}$/.test(value)
            ? true
            : 'Enter a valid four-digit Norwegian postal code.'
        }),
    }),

    defineField({
      name: 'city',
      title: 'City',
      type: 'string',
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'serviceArea',
      title: 'Service Area',
      type: 'string',
      description:
        'For example: Oslo, Eastern Norway, all of Norway, or online.',
    }),

    defineField({
      name: 'logo',
      title: 'Business Logo',
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
      ],
    }),

    defineField({
      name: 'coverImage',
      title: 'Cover Image',
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

    defineField({
      name: 'facebookUrl',
      title: 'Facebook URL',
      type: 'url',
      validation: (rule) =>
        rule.uri({
          scheme: ['http', 'https'],
        }),
    }),

    defineField({
      name: 'instagramUrl',
      title: 'Instagram URL',
      type: 'url',
      validation: (rule) =>
        rule.uri({
          scheme: ['http', 'https'],
        }),
    }),

    defineField({
      name: 'isVerified',
      title: 'Verified Business',
      type: 'boolean',
      description:
        'Enable only after the business information has been reviewed.',
      initialValue: false,
    }),

    defineField({
      name: 'isFeatured',
      title: 'Featured Listing',
      type: 'boolean',
      description:
        'Featured businesses may receive additional placement on the website.',
      initialValue: false,
    }),

    defineField({
      name: 'listingStatus',
      title: 'Listing Status',
      type: 'string',
      options: {
        list: [
          {title: 'Pending Review', value: 'pending'},
          {title: 'Active', value: 'active'},
          {title: 'Suspended', value: 'suspended'},
          {title: 'Expired', value: 'expired'},
        ],
        layout: 'radio',
      },
      initialValue: 'pending',
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
  ],

  orderings: [
    {
      title: 'Business name, A to Z',
      name: 'businessNameAsc',
      by: [{field: 'businessName', direction: 'asc'}],
    },
    {
      title: 'Newest listings first',
      name: 'publishedAtDesc',
      by: [{field: 'publishedAt', direction: 'desc'}],
    },
  ],

  preview: {
    select: {
      title: 'businessName',
      category: 'category',
      city: 'city',
      status: 'listingStatus',
      verified: 'isVerified',
      media: 'logo',
    },

    prepare({title, category, city, status, verified, media}) {
      const verification = verified ? 'Verified · ' : ''
      const location = city || 'Location not specified'
      const listingStatus = status || 'pending'

      return {
        title,
        subtitle: `${verification}${category || 'No category'} · ${location} · ${listingStatus}`,
        media,
      }
    },
  },
})