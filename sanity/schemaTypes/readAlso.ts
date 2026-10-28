import {defineArrayMember, defineField, defineType} from 'sanity'

// Only items that readers can actually open: published News and active Guides.
export const READ_ALSO_TARGET_FILTER =
  '(_type == "newsArticle" && defined(publishedAt) && dateTime(publishedAt) <= dateTime(now())) || (_type == "publicInformationGuide" && status == "active")'

export const readAlso = defineType({
  name: 'readAlsoCard',
  title: 'Read also card',
  type: 'object',
  fields: [
    defineField({
      name: 'target',
      title: 'News article or Guide',
      type: 'reference',
      description:
        'Pick a published News Article or an active Public Information Guide in the same language. The title, link and image are filled in automatically.',
      to: [{type: 'newsArticle'}, {type: 'publicInformationGuide'}],
      weak: true,
      options: {
        filter: ({document}) => {
          const currentId = document?._id?.replace(/^drafts\./, '')
          const draftId = currentId ? `drafts.${currentId}` : ''
          const language = document?.language

          const clauses = [`(${READ_ALSO_TARGET_FILTER})`]
          const params: Record<string, string> = {}

          if (language === 'ne' || language === 'nb') {
            clauses.push('language == $language')
            params.language = language
          }

          if (currentId) {
            clauses.push('_id != $currentId && _id != $draftId')
            params.currentId = currentId
            params.draftId = draftId
          }

          return {filter: clauses.join(' && '), params}
        },
      },
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {title: 'target.title', language: 'target.language', type: 'target._type'},
    prepare({title, language, type}) {
      const kind = type === 'publicInformationGuide' ? 'Guide' : 'News'
      return {
        title: title || 'Read also: no item selected',
        subtitle: `Read also · ${kind}${language ? ` · ${language}` : ''}`,
      }
    },
  },
})

// Shared array member so News and Guide bodies use one definition.
export const readAlsoBlockMember = defineArrayMember({type: 'readAlsoCard'})
