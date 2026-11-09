import {defineArrayMember, defineField} from 'sanity'
import {SearchKeywordInput} from '../components/SearchKeywordInput'
import {validateSearchKeyword, validateSearchKeywords} from './searchKeywordValidation'

export const searchKeywordsField = (group?: string, preserveGuideBehavior = false) => defineField({
  name: 'searchKeywords',
  title: 'Search Keywords and Synonyms',
  type: 'array',
  ...(group ? {group} : {}),
  description: preserveGuideBehavior
    ? 'Optional search terms in the guide language. Include everyday Nepali phrases, Norwegian official terminology, abbreviations, synonyms, and common alternative spellings where relevant. These terms are editorial metadata and do not need to be displayed publicly.'
    : 'Optional internal search metadata for this document and its content language. Enter one keyword, abbreviation, spelling variation or established phrase per item: everyday Nepali wording, official Norwegian terminology, common English equivalents, synonyms and multiword concepts. Keep phrases such as Down syndrome, personal number and residence permit together. For Directory listings, include alternate organisation/service names and services offered where useful; never replace the actual category, description or service area. Terms are not public tags or SEO keywords. Whitespace is trimmed when you leave an item.',
  of: [
    defineArrayMember({
      type: 'string',
      ...(!preserveGuideBehavior ? {components: {input: SearchKeywordInput}} : {}),
      validation: (rule) => preserveGuideBehavior
        ? rule.required().min(2).max(100)
        : rule.required().min(2).max(100).custom(validateSearchKeyword),
    }),
  ],
  validation: (rule) => preserveGuideBehavior
    ? rule.unique().max(30)
    : rule.unique().max(30).custom(validateSearchKeywords),
})
