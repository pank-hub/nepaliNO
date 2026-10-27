import type { DirectorySubmissionCopy } from "./directorySubmission";
import type { EventSubmissionCopy } from "./eventSubmission";

export const en = {
  languageName: "English",
  common: { skipToContent: "Skip to main content" },
  events: {
    categories: {
      "cultural-celebration": "Cultural celebration",
      festival: "Festival",
      "concert-artist": "Concert or artist visit",
      "community-gathering": "Community gathering",
      "social-meetup": "Social meetup",
      "student-youth": "Student or youth programme",
      "children-family": "Children and family activity",
      "workshop-seminar": "Workshop or seminar",
      "information-integration": "Information or integration meeting",
      "sports-recreation": "Sports or recreation",
      "religious-traditional": "Religious or traditional programme",
      "charity-volunteering": "Charity, fundraising or volunteering",
      "business-networking": "Business and networking",
      other: "Other community Event",
    },
    languages: {
      nepali: "Nepali",
      norwegian: "Norwegian",
      english: "English",
      "language-independent": "Language-independent",
      other: "Other",
    },
    registrationRequirements: {
      "not-required": "Registration is not required",
      recommended: "Registration is recommended",
      required: "Registration is required",
      "tickets-required": "Tickets are required",
    },
    registrationStatuses: {
      "not-applicable": "Not applicable",
      "not-yet-open": "Registration is not open yet",
      open: "Registration is open",
      closed: "Registration is closed",
      "sold-out": "Sold out",
    },
    submission: {
      metaTitle: "Submit an Event | nepali.no",
      metaDescription:
        "Submit an Event connected to the Nepali community in Norway for editorial review by nepali.no.",
      eyebrow: "Take part in the community",
      title: "Submit an Event",
      introduction:
        "Send information about an Event from your organization or community. nepali.no reviews every proposal before deciding whether to publish it.",
      beforeYouBeginTitle: "Before you begin",
      beforeYouBeginItems: [
        "Have accurate and current Event information ready.",
        "Submission does not guarantee publication.",
        "Private contact details are used only for review and necessary follow-up.",
      ],
      requiredNotice: "Fields marked with an asterisk (*) are required.",
      privateNotice:
        "This contact information stays private and is used only by the nepali.no review team.",
      publicContactNotice:
        "Information here may be used on the public Event page only when you give permission.",
      sections: {
        language: "Language and publication preference",
        organizer: "Private organizer contact",
        publicContact: "Proposed public organizer information",
        event: "Event information",
        location: "Date, venue or online access",
        registration: "Registration and price",
        image: "Optional image proposal",
        declarations: "Declarations and consent",
      },
      fields: {
        formInterfaceLanguage: "Form interface language",
        submissionLanguage: "Language used in the submission",
        otherSubmissionLanguage: "Specify another language",
        requestedPublicLanguage: "Preferred public-page language",
        organizerName: "Organizer, organization or group name",
        privateContactName: "Contact person name",
        privateContactEmail: "Private email address",
        privateContactPhone: "Private telephone number",
        preferredContactLanguage: "Preferred contact language",
        otherPreferredContactLanguage: "Other contact language",
        publicOrganizerName: "Public organizer name",
        publicOrganizerUrl: "Public website or page",
        publicOrganizerEmail: "Public email address",
        publicOrganizerPhone: "Public telephone number",
        publicContactPermission:
          "I permit publication of the proposed public contact details",
        proposedTitle: "Event title",
        summary: "Short summary",
        descriptionPlainText: "Full Event description",
        eventLanguages: "Languages used at the Event",
        otherEventLanguage: "Other Event language",
        eventType: "Event type",
        eventFormat: "Event format",
        isAllDay: "All-day Event",
        startDateTime: "Start date and time",
        endDateTime: "End date and time",
        venueName: "Venue name",
        address: "Address",
        postalCode: "Postal code",
        city: "City",
        mapUrl: "Map URL",
        onlinePlatform: "Online platform",
        onlineInformationUrl: "Online access or information URL",
        accessibilityInformation: "Accessibility information",
        transportInformation: "Transport or parking information",
        intendedAudience: "Intended audience",
        sourceUrl: "Original Event or public source URL",
        registrationRequirement: "Registration requirement",
        registrationStatus: "Registration status",
        registrationUrl: "Registration or ticket URL",
        registrationDeadline: "Registration deadline",
        isFree: "Free Event",
        priceDescription: "Price description",
        proposedImageUrl: "Proposed image URL",
        imageAltSuggestion: "Suggested alternative text",
        imageCredit: "Image credit",
        imagePermissionConfirmed:
          "I confirm that the image may be used and published",
        authorityConfirmed: "I have authority to submit this Event",
        accuracyConfirmed:
          "The information is accurate to the best of my knowledge",
        editingTranslationAccepted:
          "I accept that nepali.no may edit or translate the information",
        publicationNotGuaranteedAccepted:
          "I understand that submission does not guarantee publication",
        privacyRetentionAccepted:
          "I accept the privacy and retention information",
      },
      help: {
        submissionLanguage:
          "Choose the main language used in your Event information.",
        requestedPublicLanguage:
          "nepali.no may decide the final language and editorial format based on need and capacity.",
        privateContact:
          "These details are not shown automatically on a public page.",
        publicContact:
          "Provide only details that the public may use to contact the organizer.",
        publicContactPermission:
          "Explicit permission is required when a public email address or telephone number is proposed.",
        summary: "Summarize the most important information in 2–4 sentences.",
        descriptionPlainText:
          "Include the purpose, programme, schedule and practical information for participants.",
        eventLanguages:
          "Select every language participants will use or need to understand.",
        onlineAccessRequirement:
          "For online or hybrid Events, provide at least one of these: an online platform or a public information URL.",
        sourceUrl:
          "Provide the organizer’s official Event page when available.",
        proposedImageUrl:
          "Direct upload is not available yet. Provide only a publicly accessible URL.",
        imagePermissionConfirmed:
          "Do not propose an image when publication rights are unclear.",
        privacyRetentionAccepted:
          "Information may be retained as necessary for review, contact and documentation.",
      },
      options: {
        interfaceLanguages: { ne: "Nepali", nb: "Norwegian", en: "English" },
        submissionLanguages: {
          ne: "Nepali",
          nb: "Norwegian",
          en: "English",
          other: "Other",
        },
        publicLanguages: {
          ne: "Nepali",
          nb: "Norwegian",
          both: "Both Nepali and Norwegian",
          editorialDecision: "No preference, editorial decision",
        },
        contactLanguages: {
          ne: "Nepali",
          nb: "Norwegian",
          en: "English",
          other: "Other",
        },
        eventFormats: {
          inPerson: "In person",
          online: "Online",
          hybrid: "In person and online",
        },
      },
      actions: {
        submit: "Send for review",
        submitting: "Sending…",
        returnToEvents: "Return to Events",
        useNepali: "नेपाली",
        useNorwegian: "Norsk",
        useEnglish: "English",
      },
      messages: {
        validationSummaryTitle: "Review some details",
        validationSummaryBody: "Correct the marked fields and try again.",
        successTitle: "Event received",
        successBody: "Your Event proposal was received securely for review.",
        successReference: "Submission reference",
        publicationNotice:
          "Receiving the proposal does not guarantee publication.",
        rateLimited:
          "Too many attempts were made in a short time. Please try again later.",
        temporarilyUnavailable:
          "The Event submission service is temporarily unavailable.",
        storageFailed: "The Event could not be stored. Please try again later.",
        networkFailed:
          "A network problem occurred. Check your connection and try again.",
        unexpectedError: "An unexpected error occurred. Please try again.",
      },
    } satisfies EventSubmissionCopy,
  },
  directory: {
    submission: {
      metaTitle: "Submit a Directory listing | nepali.no",
      metaDescription:
        "Suggest a business, organization, service or digital resource for private editorial review by nepali.no.",
      eyebrow: "Suggest a useful community resource",
      title: "Submit a Community Directory listing",
      introduction:
        "You may suggest a useful business, organization, service or digital resource even when you do not represent it. Every suggestion is reviewed privately, and nepali.no decides whether anything is published.",
      beforeYouBeginTitle: "Before you begin",
      beforeYouBeginItems: [
        "Use accurate, current and publicly available information where possible.",
        "Submission does not guarantee publication.",
        "Private contact details are used only for review and necessary follow-up.",
      ],
      requiredNotice: "Fields marked with an asterisk (*) are required.",
      privateNotice:
        "These contact details remain private and are used only by the nepali.no review team.",
      suggestionNotice:
        "You may suggest a listing based on public information even when you do not represent the entity.",
      publicContactNotice:
        "Proposed details may be used publicly only after review and any necessary permission.",
      sections: {
        language: "Language and publication preference",
        applicant: "Private applicant contact",
        relationship: "Relationship or legitimate basis",
        identity: "Proposed listing identity",
        connection: "Connection to Nepal or the Nepali community",
        description: "Proposed public description",
        publicContact: "Proposed public contact",
        location: "Location and service coverage",
        links: "Links and optional images",
        declarations: "Declarations and consent",
      },
      fields: {
        submissionLanguage: "Main language used in the submission",
        otherSubmissionLanguage: "Specify another language",
        requestedPublicLanguage: "Preferred public-page language",
        applicantName: "Your name",
        applicantEmail: "Private email address",
        applicantPhone: "Private telephone number",
        preferredContactLanguage: "Preferred contact language",
        otherPreferredContactLanguage: "Other contact language",
        applicantRelationship: "Relationship to the entity",
        otherApplicantRelationship: "Describe another relationship",
        authorityExplanation:
          "Explain the relationship or legitimate basis for the suggestion",
        proposedName: "Proposed public name",
        listingType: "Listing type",
        otherListingType: "Describe another listing type",
        primaryCategory: "Primary category",
        otherCategory: "Describe another category",
        organizationNumber: "Norwegian organization number",
        entityExplanationWithoutOrganizationNumber:
          "Entity explanation when no organization number exists",
        communityConnections: "Connections to Nepal or the Nepali community",
        connectionExplanation: "Proposed public connection explanation",
        ownershipLeadershipExplanation:
          "Private ownership or leadership context",
        serviceLanguages: "Service languages",
        otherServiceLanguages: "Other service languages",
        summary: "Short public summary",
        descriptionPlainText: "Full public description",
        publicWebsite: "Public website",
        publicEmail: "Public email",
        publicPhone: "Public telephone",
        publicContactRole: "Public contact person or role",
        publicContactPermission:
          "The proposed public contact details may be published",
        presenceType: "Public presence",
        country: "Country",
        county: "County",
        municipality: "Municipality",
        city: "City or locality",
        streetAddress: "Public street address",
        postalCode: "Postal code",
        mapUrl: "Map URL",
        addressPublicationPermission:
          "The proposed address is already publicly presented by the entity",
        coverageModes: "Service coverage",
        serviceCounties: "Service counties",
        serviceMunicipalities: "Service municipalities",
        otherCoverage: "Other service coverage",
        facebookUrl: "Facebook URL",
        instagramUrl: "Instagram URL",
        linkedInUrl: "LinkedIn URL",
        proposedLogoUrl: "Proposed logo URL",
        proposedCoverImageUrl: "Proposed cover-image URL",
        imageAltSuggestion: "Suggested alternative text",
        imageCredit: "Image credit",
        imagePermissionConfirmed:
          "The proposed images may be used and published",
        legitimateBasisConfirmed:
          "I have authority or a legitimate basis to suggest this listing",
        connectionClaimsConfirmed:
          "Ownership and community-connection claims are accurate to the best of my knowledge",
        accuracyConfirmed:
          "The information is accurate to the best of my knowledge",
        editingTranslationAccepted:
          "I accept that nepali.no may edit or translate the information",
        publicationNotGuaranteedAccepted:
          "I understand that submission does not guarantee publication",
        privacyRetentionAccepted:
          "I accept the privacy and retention information",
      },
      help: {
        submissionLanguage:
          "Choose the main language used in the submitted information.",
        requestedPublicLanguage:
          "nepali.no may decide the final language and editorial format based on need and capacity.",
        privateContact:
          "These details are not shown automatically on a public page.",
        relationship:
          "State whether you represent the entity or are suggesting it on the basis of public information.",
        communitySuggestion:
          "A visitor suggestion is only a lead for independent editorial review and gives no control over the public listing.",
        organizationNumber:
          "If there is no organization number, briefly explain the entity and why it belongs in the Directory.",
        connectionExplanation:
          "Explain the connection in wording suitable for a public page.",
        ownershipLeadershipExplanation:
          "Do not submit sensitive evidence. Provide only general context needed for review.",
        summary: "Summarize the most important information in 2–4 sentences.",
        descriptionPlainText:
          "Describe the service, purpose and relevance to the community.",
        publicContact: "Provide only contact details that the public may use.",
        publicContactPermission:
          "Explicit permission is required when a public email, telephone number or contact role is proposed.",
        addressPublicationPermission:
          "If you do not represent the entity, provide only an address that the entity already publishes on its website or public profile.",
        coverage: "Select only areas where the service is genuinely available.",
        imageUrls:
          "Direct upload is not available. Provide only publicly accessible URLs.",
        imagePermissionConfirmed:
          "Do not propose a logo or image when publication rights are unclear.",
        privacyRetentionAccepted:
          "Information may be retained as necessary for review, contact and documentation.",
      },
      options: {
        submissionLanguages: {
          ne: "Nepali",
          nb: "Norwegian",
          en: "English",
          other: "Other",
        },
        publicLanguages: {
          ne: "Nepali",
          nb: "Norwegian",
          both: "Both Nepali and Norwegian",
          editorialDecision: "No preference, editorial decision",
        },
        contactLanguages: {
          ne: "Nepali",
          nb: "Norwegian",
          en: "English",
          other: "Other",
        },
        relationships: {
          ownerAuthorizedRepresentative: "Owner or authorized representative",
          founderLeader: "Founder or leader",
          employeeVolunteer: "Employee or volunteer",
          websiteAdministrator: "Website or resource administrator",
          communityMember: "Community member or visitor suggesting a listing",
          other: "Other",
        },
      },
      actions: {
        submit: "Send for review",
        submitting: "Sending…",
        returnToDirectory: "Return to the Community Directory",
        useNepali: "नेपाली",
        useNorwegian: "Norsk",
        useEnglish: "English",
      },
      messages: {
        validationSummaryTitle: "Review some details",
        validationSummaryBody: "Correct the marked fields and try again.",
        successTitle: "Suggestion received",
        successBody:
          "Your Community Directory suggestion was received securely for private review.",
        successReference: "Submission reference",
        publicationNotice:
          "Receiving the suggestion does not guarantee publication.",
        rateLimited:
          "Too many attempts were made in a short time. Please try again later.",
        temporarilyUnavailable:
          "The Community Directory submission service is temporarily unavailable.",
        storageFailed:
          "The suggestion could not be stored. Please try again later.",
        networkFailed:
          "A network problem occurred. Check your connection and try again.",
        unexpectedError: "An unexpected error occurred. Please try again.",
      },
    } satisfies DirectorySubmissionCopy,
  },
} as const;
