import {defineArrayMember, defineField, defineType} from 'sanity'

export const trustPage = defineType({
  name: 'trustPage',
  title: 'Trust Page',
  type: 'document',
  fields: [
    defineField({
      name: 'pageKey',
      title: 'Page',
      type: 'string',
      options: {
        list: [
          {title: 'About', value: 'about'},
          {title: 'Transparency', value: 'transparency'},
          {title: 'Privacy', value: 'privacy'},
          {title: 'Contact', value: 'contact'},
        ],
        layout: 'radio',
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
      to: [{type: 'trustPage'}],
      options: {
        filter: ({document}) => ({
          filter: 'pageKey == $pageKey && language == $language',
          params: {
            pageKey: document?.pageKey,
            language: document?.language === 'ne' ? 'nb' : 'ne',
          },
        }),
      },
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required().max(160),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 4,
      validation: (rule) => rule.required().max(500),
    }),
    defineField({
      name: 'eyebrow',
      title: 'Eyebrow',
      type: 'string',
      validation: (rule) => rule.required().max(120),
    }),
    defineField({
      name: 'sections',
      title: 'Content Sections',
      type: 'array',
      of: [
        defineArrayMember({
          name: 'section',
          title: 'Section',
          type: 'object',
          fields: [
            defineField({name: 'heading', title: 'Heading', type: 'string', validation: (rule) => rule.required()}),
            defineField({
              name: 'paragraphs',
              title: 'Paragraphs',
              type: 'array',
              of: [{type: 'text'}],
            }),
            defineField({
              name: 'items',
              title: 'List Items',
              type: 'array',
              of: [{type: 'text'}],
            }),
          ],
          preview: {
            select: {title: 'heading'},
          },
        }),
      ],
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: 'contactItems',
      title: 'Contact Items',
      type: 'array',
      of: [
        defineArrayMember({
          name: 'contactItem',
          title: 'Contact Item',
          type: 'object',
          fields: [
            defineField({name: 'heading', title: 'Heading', type: 'string', validation: (rule) => rule.required()}),
            defineField({name: 'text', title: 'Description', type: 'text', validation: (rule) => rule.required()}),
            defineField({name: 'label', title: 'Link Label', type: 'string'}),
            defineField({name: 'href', title: 'Link URL', type: 'string'}),
          ],
        }),
      ],
    }),
    defineField({name: 'safetyHeading', title: 'Safety Heading', type: 'string'}),
    defineField({name: 'safetyText', title: 'Safety Text', type: 'text'}),
  ],
  preview: {
    select: {title: 'title', pageKey: 'pageKey', language: 'language'},
    prepare: ({title, pageKey, language}) => ({title, subtitle: `${pageKey} · ${language}`}),
  },
})