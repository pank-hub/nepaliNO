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
    basics: string
    organizer: string
    optionalDetails: string
    declarations: string
  }
  fields: {
    proposedTitle: string
    startDateTime: string
    endDateTime: string
    additionalDates: string
    dayLabel: string
    isAllDay: string
    eventFormat: string
    city: string
    venueName: string
    onlinePlatform: string
    onlineInformationUrl: string
    eventType: string
    descriptionPlainText: string
    isFree: string
    priceDescription: string
    registrationRequirement: string
    registrationUrl: string
    organizerName: string
    privateContactName: string
    privateContactEmail: string
    privateContactPhone: string
    publicOrganizerUrl: string
    publicContactPermission: string
    summary: string
    address: string
    postalCode: string
    mapUrl: string
    eventLanguages: string
    otherEventLanguage: string
    requestedPublicLanguage: string
    registrationStatus: string
    registrationDeadline: string
    accessibilityInformation: string
    transportInformation: string
    intendedAudience: string
    sourceUrl: string
    proposedImageUrl: string
    imageAltSuggestion: string
    imageCredit: string
    imagePermissionConfirmed: string
    accuracyConfirmed: string
    privacyRetentionAccepted: string
  }
  help: {
    descriptionPlainText: string
    additionalDates: string
    onlineAccessRequirement: string
    privateContact: string
    publicContactPermission: string
    optionalDetails: string
    proposedImageUrl: string
    imagePermissionConfirmed: string
    privacyRetentionAccepted: string
  }
  options: {
    publicLanguages: {
      ne: string
      nb: string
      both: string
      editorialDecision: string
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
    addAnotherDay: string
    removeDay: string
    returnToEvents: string
    useNepali: string
    useNorwegian: string
    useEnglish: string
  }
  messages: {
    validationSummaryTitle: string
    validationSummaryBody: string
    requiredField: string
    invalidEmail: string
    invalidUrl: string
    invalidOrder: string
    descriptionTooShort: string
    onlineAccessRequired: string
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
