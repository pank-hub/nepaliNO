export const NEWS_ARTICLES_QUERY = `
  *[
    _type == "newsArticle" &&
    defined(slug.current)
  ] | order(publishedAt desc) {
    _id,
    title,
    "slug": slug.current,
    language,
    translation-> {
      _id,
      title,
      "slug": slug.current,
      language
    },
    summary,
    newsRegion,
    category,
    featuredImage {
      asset,
      alt,
      caption,
      credit,
      hotspot,
      crop
    },
    authorName,
    publishedAt,
    isFeatured
  }
`
export const NEWS_ARTICLES_BY_LANGUAGE_QUERY = `
  *[
    _type == "newsArticle" &&
    defined(slug.current) &&
    language == $language
  ] | order(publishedAt desc) {
    _id,
    title,
    "slug": slug.current,
    language,
    translation-> {
      _id,
      title,
      "slug": slug.current,
      language
    },
    summary,
    newsRegion,
    category,
    featuredImage {
      asset,
      alt,
      caption,
      credit,
      hotspot,
      crop
    },
    authorName,
    publishedAt,
    isFeatured
  }
`

export const FEATURED_NEWS_ARTICLES_QUERY = `
  *[
    _type == "newsArticle" &&
    defined(slug.current) &&
    isFeatured == true
  ] | order(publishedAt desc) [0...4] {
    _id,
    title,
    "slug": slug.current,
    language,
    translation-> {
      _id,
      title,
      "slug": slug.current,
      language
    },
    summary,
    newsRegion,
    category,
    featuredImage {
      asset,
      alt,
      caption,
      credit,
      hotspot,
      crop
    },
    authorName,
    publishedAt
  }
`

export const NEWS_ARTICLE_BY_SLUG_QUERY = `
  *[
    _type == "newsArticle" &&
    slug.current == $slug &&
    language == $language
  ][0] {
    _id,
    title,
    "slug": slug.current,
    language,
    translation-> {
      _id,
      title,
      "slug": slug.current,
      language
    },
    summary,
    newsRegion,
    category,
    featuredImage {
      asset,
      alt,
      caption,
      credit,
      hotspot,
      crop
    },
    body[] {
      ...,
      _type == "image" => {
        asset,
        alt,
        caption,
        hotspot,
        crop
      }
    },
    authorName,
    publishedAt,
    sourceUrl,
    isFeatured
  }
`
export const UPCOMING_EVENTS_QUERY = `
  *[
    _type == "communityEvent" &&
    defined(slug.current) &&
    startDateTime >= now() &&
    isCancelled != true
  ] | order(startDateTime asc) {
    _id,
    title,
    "slug": slug.current,
    summary,
    eventType,
    startDateTime,
    endDateTime,
    isOnline,
    venueName,
    address,
    city,
    onlineUrl,
    organizerName,
    registrationUrl,
    isFree,
    priceNok,
    featuredImage {
      asset,
      alt,
      caption,
      credit,
      hotspot,
      crop
    },
    isFeatured
  }
`

export const FEATURED_EVENTS_QUERY = `
  *[
    _type == "communityEvent" &&
    defined(slug.current) &&
    startDateTime >= now() &&
    isCancelled != true &&
    isFeatured == true
  ] | order(startDateTime asc) [0...4] {
    _id,
    title,
    "slug": slug.current,
    summary,
    eventType,
    startDateTime,
    endDateTime,
    isOnline,
    venueName,
    city,
    onlineUrl,
    registrationUrl,
    isFree,
    priceNok,
    featuredImage {
      asset,
      alt,
      caption,
      credit,
      hotspot,
      crop
    }
  }
`

export const EVENT_BY_SLUG_QUERY = `
  *[
    _type == "communityEvent" &&
    slug.current == $slug
  ][0] {
    _id,
    title,
    "slug": slug.current,
    summary,
    eventType,
    startDateTime,
    endDateTime,
    isOnline,
    venueName,
    address,
    city,
    onlineUrl,
    organizerName,
    organizerEmail,
    organizerPhone,
    registrationUrl,
    isFree,
    priceNok,
    featuredImage {
      asset,
      alt,
      caption,
      credit,
      hotspot,
      crop
    },
    description,
    isFeatured,
    isCancelled
  }
`
export const ACTIVE_BUSINESS_LISTINGS_QUERY = `
  *[
    _type == "businessListing" &&
    defined(slug.current) &&
    listingStatus == "active"
  ] | order(isFeatured desc, businessName asc) {
    _id,
    businessName,
    "slug": slug.current,
    category,
    shortDescription,
    city,
    serviceArea,
    phone,
    email,
    website,
    logo {
      asset,
      alt,
      hotspot,
      crop
    },
    isVerified,
    isFeatured
  }
`

export const FEATURED_BUSINESS_LISTINGS_QUERY = `
  *[
    _type == "businessListing" &&
    defined(slug.current) &&
    listingStatus == "active" &&
    isFeatured == true
  ] | order(businessName asc) [0...6] {
    _id,
    businessName,
    "slug": slug.current,
    category,
    shortDescription,
    city,
    serviceArea,
    website,
    logo {
      asset,
      alt,
      hotspot,
      crop
    },
    coverImage {
      asset,
      alt,
      caption,
      credit,
      hotspot,
      crop
    },
    isVerified
  }
`

export const BUSINESS_LISTING_BY_SLUG_QUERY = `
  *[
    _type == "businessListing" &&
    slug.current == $slug &&
    listingStatus == "active"
  ][0] {
    _id,
    businessName,
    "slug": slug.current,
    category,
    shortDescription,
    description,
    organizationNumber,
    contactPerson,
    email,
    phone,
    website,
    address,
    postalCode,
    city,
    serviceArea,
    logo {
      asset,
      alt,
      hotspot,
      crop
    },
    coverImage {
      asset,
      alt,
      caption,
      credit,
      hotspot,
      crop
    },
    facebookUrl,
    instagramUrl,
    isVerified,
    isFeatured,
    publishedAt
  }
`
export const ACTIVE_PUBLIC_INFORMATION_GUIDES_QUERY = `
  *[
    _type == "publicInformationGuide" &&
    defined(slug.current) &&
    language == $language &&
    status == "active"
  ] | order(isUrgent desc, isFeatured desc, publishedAt desc) {
    _id,
    title,
    "slug": slug.current,
    language,
    translation-> {
      _id,
      title,
      "slug": slug.current,
      language
    },
    summary,
    topic,
    intendedAudience,
    responsibleAgency,
    officialSourceUrl,
    publishedAt,
    lastReviewedAt,
    nextReviewAt,
    isFeatured,
    isUrgent
  }
`

export const FEATURED_PUBLIC_INFORMATION_GUIDES_QUERY = `
  *[
    _type == "publicInformationGuide" &&
    defined(slug.current) &&
    language == $language &&
    status == "active" &&
    isFeatured == true
  ] | order(isUrgent desc, publishedAt desc) [0...6] {
    _id,
    title,
    "slug": slug.current,
    language,
    summary,
    topic,
    responsibleAgency,
    lastReviewedAt,
    isUrgent
  }
`

export const URGENT_PUBLIC_INFORMATION_GUIDES_QUERY = `
  *[
    _type == "publicInformationGuide" &&
    defined(slug.current) &&
    language == $language &&
    status == "active" &&
    isUrgent == true
  ] | order(publishedAt desc) {
    _id,
    title,
    "slug": slug.current,
    language,
    summary,
    topic,
    responsibleAgency,
    officialSourceUrl,
    lastReviewedAt,
    nextReviewAt
  }
`

export const PUBLIC_INFORMATION_GUIDE_BY_SLUG_QUERY = `
  *[
    _type == "publicInformationGuide" &&
    slug.current == $slug &&
    language == $language &&
    status == "active"
  ][0] {
    _id,
    title,
    "slug": slug.current,
    language,
    translation-> {
      _id,
      title,
      "slug": slug.current,
      language
    },
    summary,
    topic,
    intendedAudience,
    body[] {
      ...,
      _type == "image" => {
        asset,
        alt,
        caption,
        credit,
        hotspot,
        crop
      }
    },
    responsibleAgency,
    officialSourceUrl,
    additionalOfficialLinks[] {
      label,
      url
    },
    importantTerms[] {
      term,
      explanation
    },
    editorialReviewer,
    publishedAt,
    lastReviewedAt,
    nextReviewAt,
    isFeatured,
    isUrgent,
    fundingAcknowledgement
  }
`

export const OVERDUE_PUBLIC_INFORMATION_GUIDES_QUERY = `
  *[
    _type == "publicInformationGuide" &&
    status in ["active", "needs-review"] &&
    defined(nextReviewAt) &&
    nextReviewAt < string::split(now(), "T")[0]
  ] | order(nextReviewAt asc) {
    _id,
    title,
    "slug": slug.current,
    language,
    topic,
    responsibleAgency,
    editorialReviewer,
    lastReviewedAt,
    nextReviewAt,
    status
  }
`

export const IMPORTANT_NOW_NEWS_BY_LANGUAGE_QUERY = `
  *[
    _type == "newsArticle" &&
    defined(slug.current) &&
    language == $language &&
    isImportantNow == true &&
    defined(importantUntil) &&
    importantUntil > now()
  ] | order(publishedAt desc) [0] {
    _id,
    title,
    "slug": slug.current,
    language,
    summary,
    newsRegion,
    category,
    publishedAt,
    importantUntil,
    sourceUrl
  }
`

export const HOMEPAGE_FEATURED_NEWS_BY_LANGUAGE_QUERY = `
  *[
    _type == "newsArticle" &&
    defined(slug.current) &&
    language == $language &&
    isFeatured == true
  ] | order(publishedAt desc) [0] {
    _id,
    title,
    "slug": slug.current,
    language,
    summary,
    newsRegion,
    category,
    featuredImage {
      asset,
      alt,
      caption,
      credit,
      hotspot,
      crop
    },
    authorName,
    publishedAt
  }
`

export const HOMEPAGE_LATEST_NEWS_BY_LANGUAGE_QUERY = `
  *[
    _type == "newsArticle" &&
    defined(slug.current) &&
    language == $language &&
    (!defined($excludeId) || _id != $excludeId)
  ] | order(publishedAt desc) [0...3] {
    _id,
    title,
    "slug": slug.current,
    language,
    summary,
    newsRegion,
    category,
    featuredImage {
      asset,
      alt,
      caption,
      credit,
      hotspot,
      crop
    },
    authorName,
    publishedAt
  }
`

export const NEWS_ARCHIVE_USEFUL_GUIDES_QUERY = `
  *[
    _type == "publicInformationGuide" &&
    defined(slug.current) &&
    language == $language &&
    status == "active"
  ] | order(isFeatured desc, lastReviewedAt desc, publishedAt desc) [0...3] {
    _id,
    title,
    "slug": slug.current,
    language,
    summary,
    topic,
    responsibleAgency,
    lastReviewedAt,
    isFeatured,
    isUrgent
  }
`

export const PUBLIC_INFORMATION_TOPICS_BY_LANGUAGE_QUERY = `
  *[
    _type == "publicInformationTopic" &&
    language == $language &&
    isActive == true &&
    defined(slug.current)
  ] | order(displayOrder asc, title asc) {
    _id,
    title,
    "slug": slug.current,
    language,
    topicKey,
    summary,
    displayOrder,
    iconKey,
    seoDescription,
    "guideCount": count(*[
      _type == "publicInformationGuide" &&
      language == ^.language &&
      topic == ^.topicKey &&
      status == "active" &&
      defined(slug.current)
    ])
  }
`

export const PUBLIC_INFORMATION_TOPIC_BY_SLUG_QUERY = `
  *[
    _type == "publicInformationTopic" &&
    language == $language &&
    slug.current == $slug &&
    isActive == true
  ][0] {
    _id,
    title,
    "slug": slug.current,
    language,
    topicKey,
    summary,
    introduction,
    displayOrder,
    iconKey,
    seoDescription,
    "translation": translation-> {
      _id,
      title,
      "slug": slug.current,
      language,
      isActive
    },
    "featuredGuides": featuredGuides[]-> {
      _id,
      title,
      "slug": slug.current,
      language,
      summary,
      topic,
      responsibleAgency,
      lastReviewedAt,
      nextReviewAt,
      status,
      isFeatured,
      isUrgent
    }
  }
`

export const PUBLIC_INFORMATION_GUIDES_BY_TOPIC_QUERY = `
  *[
    _type == "publicInformationGuide" &&
    language == $language &&
    topic == $topicKey &&
    status == "active" &&
    defined(slug.current)
  ] | order(isFeatured desc, isUrgent desc, lastReviewedAt desc, publishedAt desc) {
    _id,
    title,
    "slug": slug.current,
    language,
    summary,
    topic,
    intendedAudience,
    responsibleAgency,
    publishedAt,
    lastReviewedAt,
    nextReviewAt,
    isFeatured,
    isUrgent
  }
`

