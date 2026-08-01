import type {EventSubmissionCopy} from './eventSubmission'

export const en = {
  languageName: 'English',
  common: {skipToContent: 'Skip to main content'},
  events: {
    categories: {
      'cultural-celebration': 'Cultural celebration',
      festival: 'Festival',
      'concert-artist': 'Concert or artist visit',
      'community-gathering': 'Community gathering',
      'social-meetup': 'Social meetup',
      'student-youth': 'Student or youth programme',
      'children-family': 'Children and family activity',
      'workshop-seminar': 'Workshop or seminar',
      'information-integration': 'Information or integration meeting',
      'sports-recreation': 'Sports or recreation',
      'religious-traditional': 'Religious or traditional programme',
      'charity-volunteering': 'Charity, fundraising or volunteering',
      'business-networking': 'Business and networking',
      other: 'Other community Event',
    },
    languages: {
      nepali: 'Nepali',
      norwegian: 'Norwegian',
      english: 'English',
      'language-independent': 'Language-independent',
      other: 'Other',
    },
    registrationRequirements: {
      'not-required': 'Registration is not required',
      recommended: 'Registration is recommended',
      required: 'Registration is required',
      'tickets-required': 'Tickets are required',
    },
    registrationStatuses: {
      'not-applicable': 'Not applicable',
      'not-yet-open': 'Registration is not open yet',
      open: 'Registration is open',
      closed: 'Registration is closed',
      'sold-out': 'Sold out',
    },
    submission: {
      metaTitle: 'Submit an Event | nepali.no', metaDescription: 'Submit an Event connected to the Nepali community in Norway for editorial review by nepali.no.', eyebrow: 'Take part in the community', title: 'Submit an Event',
      introduction: 'Send information about an Event from your organization or community. nepali.no reviews every proposal before deciding whether to publish it.',
      beforeYouBeginTitle: 'Before you begin', beforeYouBeginItems: ['Have accurate and current Event information ready.', 'Submission does not guarantee publication.', 'Private contact details are used only for review and necessary follow-up.'], requiredNotice: 'Fields marked with an asterisk (*) are required.', privateNotice: 'This contact information stays private and is used only by the nepali.no review team.', publicContactNotice: 'Information here may be used on the public Event page only when you give permission.',
      sections: {language: 'Language and publication preference', organizer: 'Private organizer contact', publicContact: 'Proposed public organizer information', event: 'Event information', location: 'Date, venue or online access', registration: 'Registration and price', image: 'Optional image proposal', declarations: 'Declarations and consent'},
      fields: {
        formInterfaceLanguage: 'Form interface language', submissionLanguage: 'Language used in the submission', otherSubmissionLanguage: 'Specify another language', requestedPublicLanguage: 'Preferred public-page language', organizerName: 'Organizer, organization or group name', privateContactName: 'Contact person name', privateContactEmail: 'Private email address', privateContactPhone: 'Private telephone number', preferredContactLanguage: 'Preferred contact language', otherPreferredContactLanguage: 'Other contact language', publicOrganizerName: 'Public organizer name', publicOrganizerUrl: 'Public website or page', publicOrganizerEmail: 'Public email address', publicOrganizerPhone: 'Public telephone number', publicContactPermission: 'I permit publication of the proposed public contact details',
        proposedTitle: 'Event title', summary: 'Short summary', descriptionPlainText: 'Full Event description', eventLanguages: 'Languages used at the Event', otherEventLanguage: 'Other Event language', eventType: 'Event type', eventFormat: 'Event format', isAllDay: 'All-day Event', startDateTime: 'Start date and time', endDateTime: 'End date and time', venueName: 'Venue name', address: 'Address', postalCode: 'Postal code', city: 'City', mapUrl: 'Map URL', onlinePlatform: 'Online platform', onlineInformationUrl: 'Online access or information URL', accessibilityInformation: 'Accessibility information', transportInformation: 'Transport or parking information', intendedAudience: 'Intended audience', sourceUrl: 'Original Event or public source URL', registrationRequirement: 'Registration requirement', registrationStatus: 'Registration status', registrationUrl: 'Registration or ticket URL', registrationDeadline: 'Registration deadline', isFree: 'Free Event', priceDescription: 'Price description', proposedImageUrl: 'Proposed image URL', imageAltSuggestion: 'Suggested alternative text', imageCredit: 'Image credit', imagePermissionConfirmed: 'I confirm that the image may be used and published', authorityConfirmed: 'I have authority to submit this Event', accuracyConfirmed: 'The information is accurate to the best of my knowledge', editingTranslationAccepted: 'I accept that nepali.no may edit or translate the information', publicationNotGuaranteedAccepted: 'I understand that submission does not guarantee publication', privacyRetentionAccepted: 'I accept the privacy and retention information',
      },
      help: {
        submissionLanguage: 'Choose the main language used in your Event information.', requestedPublicLanguage: 'nepali.no may decide the final language and editorial format based on need and capacity.', privateContact: 'These details are not shown automatically on a public page.', publicContact: 'Provide only details that the public may use to contact the organizer.', publicContactPermission: 'Explicit permission is required when a public email address or telephone number is proposed.', summary: 'Summarize the most important information in 2–4 sentences.', descriptionPlainText: 'Include the purpose, programme, schedule and practical information for participants.', eventLanguages: 'Select every language participants will use or need to understand.', onlineAccessRequirement: 'For online or hybrid Events, provide at least one of these: an online platform or a public information URL.', sourceUrl: 'Provide the organizer’s official Event page when available.', proposedImageUrl: 'Direct upload is not available yet. Provide only a publicly accessible URL.', imagePermissionConfirmed: 'Do not propose an image when publication rights are unclear.', privacyRetentionAccepted: 'Information may be retained as necessary for review, contact and documentation.',
      },
      options: {interfaceLanguages: {ne: 'Nepali', nb: 'Norwegian', en: 'English'}, submissionLanguages: {ne: 'Nepali', nb: 'Norwegian', en: 'English', other: 'Other'}, publicLanguages: {ne: 'Nepali', nb: 'Norwegian', both: 'Both Nepali and Norwegian', editorialDecision: 'No preference, editorial decision'}, contactLanguages: {ne: 'Nepali', nb: 'Norwegian', en: 'English', other: 'Other'}, eventFormats: {inPerson: 'In person', online: 'Online', hybrid: 'In person and online'}},
      actions: {submit: 'Send for review', submitting: 'Sending…', returnToEvents: 'Return to Events', useNepali: 'नेपाली', useNorwegian: 'Norsk', useEnglish: 'English'},
      messages: {validationSummaryTitle: 'Review some details', validationSummaryBody: 'Correct the marked fields and try again.', successTitle: 'Event received', successBody: 'Your Event proposal was received securely for review.', successReference: 'Submission reference', publicationNotice: 'Receiving the proposal does not guarantee publication.', rateLimited: 'Too many attempts were made in a short time. Please try again later.', temporarilyUnavailable: 'The Event submission service is temporarily unavailable.', storageFailed: 'The Event could not be stored. Please try again later.', networkFailed: 'A network problem occurred. Check your connection and try again.', unexpectedError: 'An unexpected error occurred. Please try again.'},
    } satisfies EventSubmissionCopy,
  },
} as const
