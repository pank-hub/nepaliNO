import {defineArrayMember, defineField, defineType} from 'sanity'

export const AI_PAGE_OPTIONS = [
  {title: 'AI information (short page)', value: 'aiInformation'},
  {title: 'AI guidelines (detailed page)', value: 'aiGuidelines'},
]

const INTERNAL_LINK_OPTIONS = [
  {title: 'AI information (short page)', value: 'aiInformation'},
  {title: 'AI guidelines (detailed page)', value: 'aiGuidelines'},
  {title: 'Transparency', value: 'transparency'},
  {title: 'About', value: 'about'},
  {title: 'Privacy', value: 'privacy'},
  {title: 'Contact', value: 'contact'},
]

const hasMeaningfulText = (blocks: unknown) =>
  Array.isArray(blocks) &&
  blocks.some(
    (block) =>
      block?._type === 'block' &&
      Array.isArray(block.children) &&
      block.children.some(
        (child: {text?: unknown}) => typeof child?.text === 'string' && child.text.trim(),
      ),
  )

export const aiTransparencyPage = defineType({
  name: 'aiTransparencyPage',
  title: 'AI Transparency Page',
  type: 'document',
  description:
    'One document per page and language. The public address is fixed by the page and language and cannot be changed here.',
  fields: [
    defineField({
      name: 'pageKey',
      title: 'Page',
      type: 'string',
      description: 'Fixed after the first save so the public route cannot break.',
      options: {list: AI_PAGE_OPTIONS, layout: 'radio'},
      readOnly: ({document}) => Boolean(document?._createdAt),
      validation: (rule) =>
        rule.required().custom(async (value, context) => {
          const language = context.document?.language
          if (!value || !language) return true
          const id = (context.document?._id ?? '').replace(/^drafts\./, '')
          const count = await context
            .getClient({apiVersion: '2026-03-01'})
            .fetch<number>(
              'count(*[_type == "aiTransparencyPage" && pageKey == $pageKey && language == $language && !(_id in [$id, "drafts." + $id])])',
              {pageKey: value, language, id},
            )
          return count === 0
            ? true
            : 'A page for this language already exists. Edit the existing document instead of creating another.'
        }),
    }),
    defineField({
      name: 'language',
      title: 'Content Language',
      type: 'string',
      description: 'English is not active yet.',
      options: {
        list: [
          {title: 'नेपाली', value: 'ne'},
          {title: 'Norsk bokmål', value: 'nb'},
        ],
        layout: 'radio',
      },
      readOnly: ({document}) => Boolean(document?._createdAt),
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required().max(160),
    }),
    defineField({
      name: 'summary',
      title: 'Introduction',
      type: 'text',
      rows: 3,
      description: 'Short introduction shown under the title.',
      validation: (rule) => rule.max(400),
    }),
    defineField({
      name: 'body',
      title: 'Content',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'block',
          styles: [
            {title: 'Paragraph', value: 'normal'},
            {title: 'Heading 2', value: 'h2'},
            {title: 'Heading 3', value: 'h3'},
            {title: 'Core principle (quote)', value: 'blockquote'},
          ],
          lists: [
            {title: 'Bulleted list', value: 'bullet'},
            {title: 'Numbered list', value: 'number'},
          ],
          marks: {
            decorators: [
              {title: 'Strong', value: 'strong'},
              {title: 'Emphasis', value: 'em'},
            ],
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'External link',
                fields: [
                  defineField({
                    name: 'href',
                    title: 'URL',
                    type: 'url',
                    validation: (rule) => rule.required().uri({scheme: ['http', 'https']}),
                  }),
                ],
              },
              {
                name: 'internalPageLink',
                type: 'object',
                title: 'Link to a nepali.no page',
                fields: [
                  defineField({
                    name: 'pageKey',
                    title: 'Page',
                    type: 'string',
                    description:
                      'The address is resolved automatically for the language of this page.',
                    options: {list: INTERNAL_LINK_OPTIONS},
                    validation: (rule) => rule.required(),
                  }),
                ],
              },
            ],
          },
        }),
      ],
      validation: (rule) =>
        rule.custom((blocks) =>
          hasMeaningfulText(blocks) ? true : 'Add meaningful page content.',
        ),
    }),
    defineField({
      name: 'seoTitle',
      title: 'SEO title',
      type: 'string',
      description: 'Optional. Defaults to the title.',
      validation: (rule) => rule.max(70),
    }),
    defineField({
      name: 'seoDescription',
      title: 'Meta description',
      type: 'text',
      rows: 3,
      description: 'Optional. Defaults to the introduction.',
      validation: (rule) => rule.max(160),
    }),
    defineField({
      name: 'lastReviewedAt',
      title: 'Last reviewed',
      type: 'date',
      description: 'Optional. Shown on the public page.',
    }),
  ],
  preview: {
    select: {title: 'title', pageKey: 'pageKey', language: 'language'},
    prepare: ({title, pageKey, language}) => ({title, subtitle: `${pageKey} · ${language}`}),
  },
})
