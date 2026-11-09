import type {SupportedLanguage} from '../../i18n/config'

export interface HomeTopic {
  _id: string
  title: string
  slug: string
  iconKey?: string | null
}

export interface HomeArticle {
  _id: string
  title: string
  slug: string
  language: SupportedLanguage
  summary: string
  newsRegion: string
  category: string
  publishedAt: string
  importantUntil?: string
}

export interface HomeEvent {
  _id: string
  title: string
  slug: string
  summary: string
  eventType: string
  eventFormat: string
  eventStatus: string
  isAllDay?: boolean
  startDateTime: string
  endDateTime?: string
  additionalDates?: {startDateTime: string; endDateTime?: string}[] | null
  venueName?: string
  city?: string
  onlinePlatform?: string
  organizerName: string
  registrationRequirement?: string
  registrationStatus?: string
  isFree?: boolean
  isFeatured?: boolean
}

export interface HomeDirectoryListing {
  _id: string
  name: string
  slug: string
  language: SupportedLanguage
  listingType: string
  otherListingType?: string
  primaryCategory: string
  otherCategory?: string
  summary: string
  presenceType: string
  county?: string
  municipality?: string
  city?: string
  isVerified?: boolean
  isFeatured?: boolean
}
