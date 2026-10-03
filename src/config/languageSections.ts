import type {SupportedLanguage} from '../i18n/config'

export type SiteSection =
  | 'news'
  | 'information'
  | 'events'
  | 'directory'
  | 'forum'

// The Norwegian site currently publishes News only. Re-enable a section here
// when Norwegian content for it exists.
const enabledSections: Record<SupportedLanguage, Record<SiteSection, boolean>> = {
  ne: {news: true, information: true, events: true, directory: true, forum: true},
  nb: {news: true, information: false, events: false, directory: false, forum: false},
}

export const isSectionEnabled = (
  language: SupportedLanguage,
  section: SiteSection,
): boolean => enabledSections[language][section]

export const getLanguagesWithSection = (section: SiteSection): SupportedLanguage[] =>
  (Object.keys(enabledSections) as SupportedLanguage[]).filter((language) =>
    isSectionEnabled(language, section),
  )

const pathSections: Record<string, SiteSection> = {
  info: 'information',
  events: 'events',
  directory: 'directory',
}

// Language-switcher targets must not point at a disabled section.
export const resolveAlternatePath = (
  language: SupportedLanguage,
  path: string,
): string => {
  const [, pathLanguage, firstSegment] = path.split('/')
  const section = pathSections[firstSegment ?? '']

  if (pathLanguage === language && section && !isSectionEnabled(language, section)) {
    return `/${language}/`
  }

  return path
}
