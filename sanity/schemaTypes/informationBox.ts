import {defineArrayMember, defineField, defineType} from 'sanity'

export const informationBoxVariants = [
  {title: 'Important information', value: 'important'},
  {title: 'Attention / warning', value: 'attention'},
  {title: 'Useful tip', value: 'tip'},
  {title: 'Key fact', value: 'fact'},
]

type PreviewBlock = {_type?: string; children?: {text?: string}[]}

const firstPlainText = (body: unknown): string | undefined => {
  if (!Array.isArray(body)) return undefined
  for (const block of body as PreviewBlock[]) {
    const text = block?._type === 'block' ? block.children?.map((child) => child.text ?? '').join('') : ''
    if (text?.trim()) return text.trim()
  }
  return undefined
}

export const informationBox = defineType({
  name: 'informationBox',
  title: 'Information box',
  type: 'object',
  fields: [
    defineField({
      name: 'variant',
      title: 'Type of box',
      type: 'string',
      options: {list: informationBoxVariants, layout: 'radio'},
      initialValue: 'important',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description:
        'Optional. Write in the document language. The type label (for example “Important information”) is always shown automatically.',
      validation: (rule) => rule.max(80),
    }),
    defineField({
      name: 'body',
      title: 'Content',
      type: 'array',
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
      validation: (rule) => rule.required().min(1),
    }),
  ],
  preview: {
    select: {title: 'title', body: 'body'},
    prepare({title, body}) {
      return {
        title: title || firstPlainText(body) || 'Empty information box',
      }
    },
  },
})

// Shared array member so News and Guide bodies use one definition.
export const informationBoxBlockMember = defineArrayMember({type: 'informationBox'})
