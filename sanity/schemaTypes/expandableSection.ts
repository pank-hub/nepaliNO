import {defineArrayMember, defineField, defineType} from 'sanity'

export const expandableSectionPreviewSizes = [
  {title: 'Compact — shows a short preview', value: 'compact'},
  {title: 'Standard — shows a balanced preview', value: 'standard'},
  {title: 'Extended — shows a longer preview', value: 'extended'},
]

const previewBlockCount = {
  compact: 1,
  standard: 2,
  extended: 3,
} as const

type PreviewSize = keyof typeof previewBlockCount
type ListBlock = {
  _type?: string
  listItem?: string
  level?: number
  children?: {text?: unknown}[]
}

const countContentGroups = (value: unknown): number => {
  if (!Array.isArray(value)) return 0

  let groups = 0
  let previousListStyle: string | undefined

  for (const item of value as ListBlock[]) {
    if (item?._type !== 'block') {
      previousListStyle = undefined
      continue
    }
    if (
      !Array.isArray(item.children) ||
      !item.children.some((child) => typeof child?.text === 'string' && child.text.trim())
    ) {
      previousListStyle = undefined
      continue
    }

    const listStyle = item.listItem
    if (listStyle !== 'bullet' && listStyle !== 'number') {
      groups += 1
      previousListStyle = undefined
      continue
    }

    if (previousListStyle !== listStyle) groups += 1
    previousListStyle = listStyle
  }

  return groups
}

const validateExpandableBody = (body: unknown, context: {parent?: unknown}) => {
  const parent = context.parent
  const size =
    typeof parent === 'object' && parent !== null && !Array.isArray(parent)
      ? (parent as Record<string, unknown>).previewSize
      : undefined
  const previewSize =
    typeof size === 'string' && Object.hasOwn(previewBlockCount, size)
      ? (size as PreviewSize)
      : 'standard'
  const requiredGroups = previewBlockCount[previewSize] + 1

  return countContentGroups(body) >= requiredGroups
    ? true
    : `Add more content to reach at least ${requiredGroups} separate paragraphs or complete lists, or choose a smaller preview size.`
}

export const expandableSection = defineType({
  name: 'expandableSection',
  title: 'Expandable Section',
  type: 'object',
  description:
    'Optional supplementary or detailed information. The opening paragraphs or complete lists become the collapsed preview.',
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
        'The preview shows complete opening paragraphs or lists. Choose a short, balanced or longer preview.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'body',
      title: 'Content',
      type: 'array',
      description: [
        'Use this for supplementary or detailed information, not to conceal weak or repetitive writing.',
        'The opening paragraphs or complete lists become the collapsed preview. Put the most useful introductory context first.',
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
