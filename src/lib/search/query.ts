// One published snapshot. No previews, relationships, private contact data or travel sources.
export const SHARED_SEARCH_QUERY = `
  *[
    !(_id in path("drafts.**")) &&
    !(_id in path("versions.**")) &&
    language == $language &&
    defined(slug.current) &&
    (
      (_type == "publicInformationGuide" && $guidance && status == "active") ||
      (_type == "newsArticle" && defined(publishedAt) && publishedAt <= now()) ||
      (_type == "directoryListing" && $directory && listingStatus == "active" &&
        defined(publishedAt) && publishedAt <= now())
    )
  ] | order(_id asc) {
    _id, _type, language, "slug": slug.current,
    "title": coalesce(title, name),
    summary, searchKeywords,
    "date": coalesce(lastReviewedAt, lastVerifiedAt, publishedAt),
    "category": select(_type == "directoryListing" => primaryCategory, category),
    otherCategory, listingType, otherListingType,
    "topicTitle": *[
      _type == "publicInformationTopic" && language == ^.language &&
      topicKey == ^.topic && isActive == true
    ][0].title,
    responsibleAgency, sourceUrl,
    city, municipality, county, coverageModes, serviceCounties, serviceMunicipalities, otherCoverage,
    "bodyText": pt::text(body[_type == "block"]),
    "supplementaryText": body[_type in ["informationBox", "expandableSection"]] {
      title, "text": pt::text(body)
    },
    "descriptionText": pt::text(description)
  }
`
