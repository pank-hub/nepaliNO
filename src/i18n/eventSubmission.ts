export type EventSubmissionCopy = {
  metaTitle: string
  metaDescription: string
  eyebrow: string
  title: string
  introduction: string
  beforeYouBeginTitle: string
  beforeYouBeginItems: readonly string[]
  requiredNotice: string
  privateNotice: string
  publicContactNotice: string
  sections: {
    language: string
    organizer: string
    publicContact: string
    event: string
    location: string
    registration: string
    image: string
    declarations: string
  }
  fields: {
    formInterfaceLanguage: string
    submissionLanguage: string
    otherSubmissionLanguage: string
    requestedPublicLanguage: string
    organizerName: string
    privateContactName: string
    privateContactEmail: string
    privateContactPhone: string
    preferredContactLanguage: string
    otherPreferredContactLanguage: string
    publicOrganizerName: string
    publicOrganizerUrl: string
    publicOrganizerEmail: string
    publicOrganizerPhone: string
    publicContactPermission: string
    proposedTitle: string
    summary: string
    descriptionPlainText: string
    eventLanguages: string
    otherEventLanguage: string
    eventType: string
    eventFormat: string
    isAllDay: string
    startDateTime: string
    endDateTime: string
    venueName: string
    address: string
    postalCode: string
    city: string
    mapUrl: string
    onlinePlatform: string
    onlineInformationUrl: string
    accessibilityInformation: string
    transportInformation: string
    intendedAudience: string
    sourceUrl: string
    registrationRequirement: string
    registrationStatus: string
    registrationUrl: string
    registrationDeadline: string
    isFree: string
    priceDescription: string
    proposedImageUrl: string
    imageAltSuggestion: string
    imageCredit: string
    imagePermissionConfirmed: string
    authorityConfirmed: string
    accuracyConfirmed: string
    editingTranslationAccepted: string
    publicationNotGuaranteedAccepted: string
    privacyRetentionAccepted: string
  }
  help: {
    submissionLanguage: string
    requestedPublicLanguage: string
    privateContact: string
    publicContact: string
    publicContactPermission: string
    summary: string
    descriptionPlainText: string
    eventLanguages: string
    onlineAccessRequirement: string
    sourceUrl: string
    proposedImageUrl: string
    imagePermissionConfirmed: string
    privacyRetentionAccepted: string
  }
  options: {
    interfaceLanguages: {
      ne: string
      nb: string
      en: string
    }
    submissionLanguages: {
      ne: string
      nb: string
      en: string
      other: string
    }
    publicLanguages: {
      ne: string
      nb: string
      both: string
      editorialDecision: string
    }
    contactLanguages: {
      ne: string
      nb: string
      en: string
      other: string
    }
    eventFormats: {
      inPerson: string
      online: string
      hybrid: string
    }
  }
  actions: {
    submit: string
    submitting: string
    returnToEvents: string
    useNepali: string
    useNorwegian: string
    useEnglish: string
  }
  messages: {
    validationSummaryTitle: string
    validationSummaryBody: string
    successTitle: string
    successBody: string
    successReference: string
    publicationNotice: string
    rateLimited: string
    temporarilyUnavailable: string
    storageFailed: string
    networkFailed: string
    unexpectedError: string
  }
}

export type EventSubmissionInterfaceLanguage = 'ne' | 'nb' | 'en'
