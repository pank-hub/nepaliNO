import {defineArrayMember, defineField, defineType} from 'sanity'

export const expandableSectionPreviewSizes = [
  {title: 'Compact — approximately 4 lines', value: 'compact'},
  {title: 'Standard — approximately 6 lines', value: 'standard'},
  {title: 'Extended — approximately 9 lines', value: 'extended'},
]

const hasMeaningfulBody = (body: unknown) =>
  Array.isArray(body) &&
  body.some(
    (block) =>
      typeof block === 'object' &&
      block !== null &&
      !Array.isArray(block) &&
      Array.isArray((block as {children?: unknown}).children) &&
      (block as {children: unknown[]}).children.some(
        (child) =>
          typeof child === 'object' &&
          child !== null &&
          !Array.isArray(child) &&
          typeof (child as {text?: unknown}).text === 'string' &&
          (child as {text: string}).text.trim().length > 0,
      ),
  )

const validateExpandableBody = (body: unknown) =>
  hasMeaningfulBody(body)
    ? true
    : 'Add at least one paragraph or list item containing meaningful text.'

export const expandableSection = defineType({
  name: 'expandableSection',
  title: 'Expandable Section',
  type: 'object',
  description:
    'Optional supplementary or detailed information. Choose an approximate preview length; the final two preview lines fade, and exact wrapping varies by screen width and language. Full formatting, lists, emphasis, and safe links appear when opened.',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Write a concise title in the document language.',
      validation: (rule) =>
        rule
          .required()
          .max(160)
          .custom((value) =>
            typeof value === 'string' && value.trim().length > 0
              ? true
              : 'Enter a title containing at least one non-space character.',
          ),
    }),
    defineField({
      name: 'previewSize',
      title: 'Collapsed preview',
      type: 'string',
      options: {list: expandableSectionPreviewSizes, layout: 'radio'},
      initialValue: 'standard',
      description:
        'Choose how much text readers see before expanding the section. The complete formatted content appears when the section is opened.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'body',
      title: 'Content',
      type: 'array',
      description: [
        'Use this for supplementary or detailed information, not to conceal weak or repetitive writing.',
        'Choose how much text readers see before expanding the section. Compact shows approximately 4 lines, Standard 6 lines, and Extended 9 lines; the final two lines fade. Wrapping varies slightly by screen width and language.',
        'The complete formatted content, including lists, emphasis, and safe links, appears when the section is opened.',
        'Do not hide important safety information, deadlines or actions unnecessarily.',
      ].join(' '),
      of: [
        defineArrayMember({
          type: 'block',
          styles: [{title: 'Normal', value: 'normal'}],
          lists: [
            {title: 'Bullet', value: 'bullet'},
            {title: 'Numbered', value: 'number'},
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
                title: 'Link',
                fields: [
                  defineField({
                    name: 'href',
                    title: 'URL',
                    type: 'url',
                    validation: (rule) =>
                      rule.uri({scheme: ['http', 'https'], allowRelative: true}),
                  }),
                ],
              },
            ],
          },
        }),
      ],
      validation: (rule) => rule.required().custom(validateExpandableBody),
    }),
  ],
  preview: {
    select: {title: 'title', previewSize: 'previewSize', body: 'body'},
    prepare({title, previewSize, body}) {
      const count = Array.isArray(body) ? body.length : 0
      return {
        title: title || 'Expandable Section: no title',
        subtitle: `${previewSize || 'standard'} preview · ${count} content blocks`,
      }
    },
  },
})

export const expandableSectionBlockMember = defineArrayMember({type: 'expandableSection'})
