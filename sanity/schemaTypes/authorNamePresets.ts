export type AuthorType = 'person' | 'organization'

export const AUTHOR_TYPE_OPTIONS: {title: string; value: AuthorType}[] = [
  {title: 'Person', value: 'person'},
  {title: 'Organization', value: 'organization'},
]

export interface AuthorPreset {
  name: string
  type: AuthorType
}

// Add an author here to make it available in the News Author dropdown.
// The first entry is also the default for new articles.
export const AUTHOR_PRESETS: AuthorPreset[] = [
  {name: 'nepali.no Editorial', type: 'organization'},
  {name: 'Pankaj Kafley', type: 'person'},
]

export const AUTHOR_NAME_PRESETS = AUTHOR_PRESETS.map((preset) => preset.name)

export const findAuthorPreset = (name?: string): AuthorPreset | undefined =>
  name ? AUTHOR_PRESETS.find((preset) => preset.name === name) : undefined

// A custom author is any non-empty name that is not one of the presets.
export const isCustomAuthorName = (name?: string): boolean =>
  typeof name === 'string' && name.trim() !== '' && !findAuthorPreset(name)

export const AUTHOR_TYPE_WARNING =
  'Choose Person or Organization for this author. Without it, the type is guessed from the name.'

export const getMissingAuthorTypeWarning = (
  authorName?: string,
  authorType?: string,
): string | true => (isCustomAuthorName(authorName) && !authorType ? AUTHOR_TYPE_WARNING : true)

export const OTHER_AUTHOR = '__other__'

export interface AuthorSelection {
  authorName?: string
  authorType?: AuthorType
}

// A preset sets both fields. Empty or "Other" clears both so a previous preset's
// type is never carried over to a custom name; the editor then picks the type.
export const resolveAuthorSelection = (selected: string): AuthorSelection => {
  const preset = selected === OTHER_AUTHOR ? undefined : findAuthorPreset(selected)
  return preset ? {authorName: preset.name, authorType: preset.type} : {}
}

export type AuthorPatchSpec<Segment> =
  | {op: 'set'; path: Segment[]; value: string}
  | {op: 'unset'; path: Segment[]}

// Field-scoped patches only; no document-level or unrelated paths are touched.
// Generic over the path segment type so Sanity's own Path type passes through unchanged.
export const buildAuthorPatchSpecs = <Segment>(
  parentPath: Segment[],
  selection: AuthorSelection,
): AuthorPatchSpec<Segment>[] =>
  (['authorName', 'authorType'] as const).map((field) => {
    const path = [...parentPath, field] as Segment[]
    const value = selection[field]
    return value ? {op: 'set', path, value} : {op: 'unset', path}
  })
