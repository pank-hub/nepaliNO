export const NEWS_ARTICLES_QUERY = `
  *[
    _type == "newsArticle" &&
    defined(slug.current)
  ] | order(publishedAt desc) {
    _id,
    title,
    "slug": slug.current,
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
    slug.current == $slug
  ][0] {
    _id,
    title,
    "slug": slug.current,
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