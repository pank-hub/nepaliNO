export const finalNewsCategories = [
  {title: 'Current Affairs', value: 'current-affairs'},
  {title: 'Immigration and Integration', value: 'immigration-integration'},
  {title: 'Education and Student Life', value: 'education-student-life'},
  {title: 'Work and Employment', value: 'work-employment'},
  {title: 'Economy and Personal Finance', value: 'economy-personal-finance'},
  {title: 'Consumer and Everyday Life', value: 'consumer-everyday-life'},
  {title: 'Culture and Community', value: 'culture-community'},
  {title: 'Health and Welfare', value: 'health-welfare'},
  {title: 'Sports', value: 'sports'},
  {title: 'Technology and Digital Life', value: 'technology-digital-life'},
]

export const legacyNewsCategory = {
  title: 'Employment and Economy, legacy: please reassign',
  value: 'employment-economy',
}

export const newsCategoryOptions = [...finalNewsCategories, legacyNewsCategory]

export const newsCategoryFilter = '_type == "newsArticle" && category == $category'
