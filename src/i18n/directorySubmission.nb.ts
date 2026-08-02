import type { DirectorySubmissionCopy } from "./directorySubmission";

export const directorySubmissionNB = {
  metaTitle: "Send inn en katalogoppføring | nepali.no",
  metaDescription:
    "Foreslå en virksomhet, organisasjon, tjeneste eller digital ressurs for privat redaksjonell vurdering hos nepali.no.",
  eyebrow: "Foreslå en nyttig ressurs",
  title: "Send inn en oppføring til fellesskapskatalogen",
  introduction:
    "Du kan foreslå en nyttig virksomhet, organisasjon, tjeneste eller digital ressurs selv om du ikke representerer den. Hvert forslag vurderes privat, og nepali.no avgjør om noe skal publiseres.",
  beforeYouBeginTitle: "Før du begynner",
  beforeYouBeginItems: [
    "Bruk så langt som mulig korrekt, oppdatert og offentlig tilgjengelig informasjon.",
    "Innsending gir ingen garanti for publisering.",
    "Private kontaktopplysninger brukes bare til vurdering og nødvendig oppfølging.",
  ],
  requiredNotice: "Felt merket med stjerne (*) er obligatoriske.",
  privateNotice:
    "Disse kontaktopplysningene forblir private og brukes bare av vurderingsteamet hos nepali.no.",
  suggestionNotice:
    "Du kan foreslå en oppføring basert på offentlig informasjon selv om du ikke representerer virksomheten eller organisasjonen.",
  publicContactNotice:
    "Foreslåtte opplysninger kan bare brukes offentlig etter vurdering og nødvendig tillatelse.",
  sections: {
    language: "Språk og publiseringsønske",
    applicant: "Privat kontaktinformasjon",
    relationship: "Tilknytning eller legitimt grunnlag",
    identity: "Foreslått identitet",
    connection: "Tilknytning til Nepal eller det nepalske miljøet",
    description: "Foreslått offentlig beskrivelse",
    publicContact: "Foreslått offentlig kontakt",
    location: "Sted og tjenesteområde",
    links: "Lenker og valgfrie bilder",
    declarations: "Erklæringer og samtykke",
  },
  fields: {
    submissionLanguage: "Hovedspråk i innsendingen",
    otherSubmissionLanguage: "Oppgi et annet språk",
    requestedPublicLanguage: "Ønsket språk for offentlig side",
    applicantName: "Navnet ditt",
    applicantEmail: "Privat e-postadresse",
    applicantPhone: "Privat telefonnummer",
    preferredContactLanguage: "Foretrukket kontaktspråk",
    otherPreferredContactLanguage: "Annet kontaktspråk",
    applicantRelationship: "Din tilknytning til enheten",
    otherApplicantRelationship: "Beskriv annen tilknytning",
    authorityExplanation:
      "Forklar tilknytningen eller grunnlaget for forslaget",
    proposedName: "Foreslått offentlig navn",
    listingType: "Type oppføring",
    otherListingType: "Beskriv annen type",
    primaryCategory: "Hovedkategori",
    otherCategory: "Beskriv annen kategori",
    organizationNumber: "Norsk organisasjonsnummer",
    entityExplanationWithoutOrganizationNumber:
      "Forklaring når organisasjonsnummer mangler",
    communityConnections: "Tilknytning til Nepal eller det nepalske miljøet",
    connectionExplanation: "Foreslått offentlig forklaring av tilknytningen",
    ownershipLeadershipExplanation:
      "Privat forklaring om eierskap eller ledelse",
    serviceLanguages: "Tjenestespråk",
    otherServiceLanguages: "Andre tjenestespråk",
    summary: "Kort offentlig sammendrag",
    descriptionPlainText: "Full offentlig beskrivelse",
    publicWebsite: "Offentlig nettsted",
    publicEmail: "Offentlig e-post",
    publicPhone: "Offentlig telefon",
    publicContactRole: "Offentlig kontaktperson eller rolle",
    publicContactPermission:
      "Det er tillatt å publisere de foreslåtte offentlige kontaktopplysningene",
    presenceType: "Offentlig tilstedeværelse",
    country: "Land",
    county: "Fylke",
    municipality: "Kommune",
    city: "By eller sted",
    streetAddress: "Offentlig gateadresse",
    postalCode: "Postnummer",
    mapUrl: "Kartlenke",
    addressPublicationPermission:
      "Den foreslåtte adressen er allerede offentliggjort av enheten",
    coverageModes: "Tjenesteområde",
    serviceCounties: "Fylker som betjenes",
    serviceMunicipalities: "Kommuner som betjenes",
    otherCoverage: "Annet tjenesteområde",
    facebookUrl: "Facebook-lenke",
    instagramUrl: "Instagram-lenke",
    linkedInUrl: "LinkedIn-lenke",
    proposedLogoUrl: "Foreslått logo-URL",
    proposedCoverImageUrl: "Foreslått forsidebilde-URL",
    imageAltSuggestion: "Forslag til alternativ tekst",
    imageCredit: "Bildekreditering",
    imagePermissionConfirmed:
      "Det er tillatt å bruke og publisere foreslåtte bilder",
    legitimateBasisConfirmed:
      "Jeg har fullmakt eller et legitimt grunnlag for å foreslå oppføringen",
    connectionClaimsConfirmed:
      "Opplysninger om eierskap og fellesskapstilknytning er riktige etter beste kunnskap",
    accuracyConfirmed: "Opplysningene er riktige etter beste kunnskap",
    editingTranslationAccepted:
      "Jeg godtar at nepali.no kan redigere eller oversette opplysningene",
    publicationNotGuaranteedAccepted:
      "Jeg forstår at innsending ikke gir garanti for publisering",
    privacyRetentionAccepted:
      "Jeg godtar informasjonen om personvern og lagringstid",
  },
  help: {
    submissionLanguage: "Velg hovedspråket som brukes i opplysningene.",
    requestedPublicLanguage:
      "nepali.no kan avgjøre endelig språk og redaksjonell form ut fra behov og kapasitet.",
    privateContact:
      "Disse opplysningene vises ikke automatisk på en offentlig side.",
    relationship:
      "Oppgi om du representerer enheten eller foreslår den på grunnlag av offentlig informasjon.",
    communitySuggestion:
      "Et forslag fra en vanlig besøkende er bare et tips til uavhengig redaksjonell vurdering og gir ingen kontroll over oppføringen.",
    organizationNumber:
      "Hvis organisasjonsnummer mangler, forklar kort hva slags enhet dette er og hvorfor den passer i katalogen.",
    connectionExplanation:
      "Forklar tilknytningen slik at den kan forstås offentlig.",
    ownershipLeadershipExplanation:
      "Ikke send sensitive bevis. Gi bare nødvendig generell bakgrunn for vurdering.",
    summary: "Oppsummer det viktigste i 2–4 setninger.",
    descriptionPlainText:
      "Beskriv tilbudet, formålet og nytten for fellesskapet.",
    publicContact:
      "Oppgi bare kontaktinformasjon som offentligheten kan bruke.",
    publicContactPermission:
      "Eksplisitt tillatelse kreves når offentlig e-post, telefon eller kontaktrolle foreslås.",
    addressPublicationPermission:
      "Hvis du ikke representerer enheten, oppgi bare adresse som enheten selv har publisert på nettsted eller offentlig profil.",
    coverage: "Velg bare områder der tjenesten faktisk er tilgjengelig.",
    imageUrls:
      "Direkte opplasting er ikke tilgjengelig. Oppgi bare offentlig tilgjengelige URL-er.",
    imagePermissionConfirmed:
      "Ikke foreslå logo eller bilde når publiseringsrettighetene er uklare.",
    privacyRetentionAccepted:
      "Opplysningene kan lagres så lenge det er nødvendig for vurdering, kontakt og dokumentasjon.",
  },
  options: {
    submissionLanguages: {
      ne: "Nepali",
      nb: "Norsk",
      en: "Engelsk",
      other: "Annet",
    },
    publicLanguages: {
      ne: "Nepali",
      nb: "Norsk",
      both: "Både nepali og norsk",
      editorialDecision: "Ingen preferanse, redaksjonell avgjørelse",
    },
    contactLanguages: {
      ne: "Nepali",
      nb: "Norsk",
      en: "Engelsk",
      other: "Annet",
    },
    relationships: {
      ownerAuthorizedRepresentative: "Eier eller autorisert representant",
      founderLeader: "Grunnlegger eller leder",
      employeeVolunteer: "Ansatt eller frivillig",
      websiteAdministrator: "Administrator for nettsted eller ressurs",
      communityMember:
        "Fellesskapsmedlem eller besøkende som foreslår en oppføring",
      other: "Annet",
    },
  },
  actions: {
    submit: "Send til vurdering",
    submitting: "Sender…",
    returnToDirectory: "Tilbake til fellesskapskatalogen",
    useNepali: "नेपाली",
    useNorwegian: "Norsk",
    useEnglish: "English",
  },
  messages: {
    validationSummaryTitle: "Kontroller noen opplysninger",
    validationSummaryBody: "Rett de markerte feltene og prøv på nytt.",
    successTitle: "Forslaget er mottatt",
    successBody:
      "Forslaget til fellesskapskatalogen er mottatt sikkert for privat vurdering.",
    successReference: "Referanse",
    publicationNotice: "Mottak av forslaget gir ingen garanti for publisering.",
    rateLimited:
      "Det er gjort for mange forsøk på kort tid. Prøv igjen senere.",
    temporarilyUnavailable:
      "Innsendingstjenesten for fellesskapskatalogen er midlertidig utilgjengelig.",
    storageFailed: "Forslaget kunne ikke lagres. Prøv igjen senere.",
    networkFailed:
      "Det oppstod et nettverksproblem. Kontroller tilkoblingen og prøv igjen.",
    unexpectedError: "Det oppstod en uventet feil. Prøv igjen.",
  },
} satisfies DirectorySubmissionCopy;
