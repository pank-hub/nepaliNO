import type {SupportedLanguage} from '../../i18n/config'
import type {SanityImageCrop, SanityImageHotspot} from '@sanity/image-url'

export interface HomeTopic {
  _id: string
  title: string
  slug: string
  topicKey: string
  summary: string
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
  featuredImage?: {
    asset?: {_ref: string} | null
    alt?: string | null
    crop?: SanityImageCrop
    hotspot?: SanityImageHotspot
  } | null
}

export interface HomeSanityImage {
  asset?: {_ref: string} | null
  alt?: string | null
  crop?: SanityImageCrop
  hotspot?: SanityImageHotspot
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
  featuredImage?: HomeSanityImage | null
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
  logo?: HomeSanityImage | null
  coverImage?: HomeSanityImage | null
}
