export type DirectorySubmissionInput = {
  formInterfaceLanguage: "ne" | "nb" | "en";
  submissionLanguage: "ne" | "nb" | "en" | "other";
  otherSubmissionLanguage?: string;
  requestedPublicLanguage: "ne" | "nb" | "both" | "editorial-decision";
  applicantName: string;
  applicantEmail: string;
  applicantPhone?: string;
  preferredContactLanguage: "ne" | "nb" | "en" | "other";
  otherPreferredContactLanguage?: string;
  applicantRelationship:
    | "owner-authorized-representative"
    | "founder-leader"
    | "employee-volunteer"
    | "website-administrator"
    | "community-member"
    | "other";
  otherApplicantRelationship?: string;
  authorityExplanation: string;
  proposedName: string;
  listingType:
    | "business"
    | "professional-service"
    | "organization-association"
    | "ngo-charity"
    | "community-group"
    | "public-interest-service"
    | "website-digital-resource"
    | "other";
  otherListingType?: string;
  primaryCategory: string;
  otherCategory?: string;
  organizationNumber?: string;
  entityExplanationWithoutOrganizationNumber?: string;
  communityConnections: string[];
  connectionExplanation: string;
  ownershipLeadershipExplanation?: string;
  serviceLanguages: Array<"nepali" | "norwegian" | "english" | "other">;
  otherServiceLanguages?: string[];
  summary: string;
  descriptionPlainText: string;
  publicWebsite?: string;
  publicEmail?: string;
  publicPhone?: string;
  publicContactRole?: string;
  publicContactPermission: boolean;
  presenceType:
    "physical" | "online-only" | "physical-and-online" | "no-public-location";
  country?: string;
  county?: string;
  municipality?: string;
  city?: string;
  streetAddress?: string;
  postalCode?: string;
  mapUrl?: string;
  addressPublicationPermission: boolean;
  coverageModes: string[];
  serviceCounties?: string[];
  serviceMunicipalities?: string[];
  otherCoverage?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  linkedInUrl?: string;
  proposedLogoUrl?: string;
  proposedCoverImageUrl?: string;
  imageAltSuggestion?: string;
  imageCredit?: string;
  imagePermissionConfirmed: boolean;
  legitimateBasisConfirmed: true;
  connectionClaimsConfirmed: true;
  accuracyConfirmed: true;
  editingTranslationAccepted: true;
  publicationNotGuaranteedAccepted: true;
  privacyRetentionAccepted: true;
};

export type DirectoryValidationError = {
  field: string;
  code: string;
  message: string;
};

export type DirectoryValidationResult =
  | { ok: true; data: DirectorySubmissionInput }
  | { ok: false; errors: DirectoryValidationError[]; spam?: boolean };

const ALLOWED_FIELDS = new Set([
  "website",
  "formInterfaceLanguage",
  "submissionLanguage",
  "otherSubmissionLanguage",
  "requestedPublicLanguage",
  "applicantName",
  "applicantEmail",
  "applicantPhone",
  "preferredContactLanguage",
  "otherPreferredContactLanguage",
  "applicantRelationship",
  "otherApplicantRelationship",
  "authorityExplanation",
  "proposedName",
  "listingType",
  "otherListingType",
  "primaryCategory",
  "otherCategory",
  "organizationNumber",
  "entityExplanationWithoutOrganizationNumber",
  "communityConnections",
  "connectionExplanation",
  "ownershipLeadershipExplanation",
  "serviceLanguages",
  "otherServiceLanguages",
  "summary",
  "descriptionPlainText",
  "publicWebsite",
  "publicEmail",
  "publicPhone",
  "publicContactRole",
  "publicContactPermission",
  "presenceType",
  "country",
  "county",
  "municipality",
  "city",
  "streetAddress",
  "postalCode",
  "mapUrl",
  "addressPublicationPermission",
  "coverageModes",
  "serviceCounties",
  "serviceMunicipalities",
  "otherCoverage",
  "facebookUrl",
  "instagramUrl",
  "linkedInUrl",
  "proposedLogoUrl",
  "proposedCoverImageUrl",
  "imageAltSuggestion",
  "imageCredit",
  "imagePermissionConfirmed",
  "legitimateBasisConfirmed",
  "connectionClaimsConfirmed",
  "accuracyConfirmed",
  "editingTranslationAccepted",
  "publicationNotGuaranteedAccepted",
  "privacyRetentionAccepted",
]);

const INTERFACE_LANGUAGES = new Set(["ne", "nb", "en"]);
const SUBMISSION_LANGUAGES = new Set(["ne", "nb", "en", "other"]);
const PUBLIC_LANGUAGES = new Set(["ne", "nb", "both", "editorial-decision"]);
const RELATIONSHIPS = new Set([
  "owner-authorized-representative",
  "founder-leader",
  "employee-volunteer",
  "website-administrator",
  "community-member",
  "other",
]);
const LISTING_TYPES = new Set([
  "business",
  "professional-service",
  "organization-association",
  "ngo-charity",
  "community-group",
  "public-interest-service",
  "website-digital-resource",
  "other",
]);
const CATEGORIES = new Set([
  "food-restaurants-catering",
  "groceries-retail",
  "legal-services",
  "accounting-tax-finance",
  "cleaning-household-services",
  "construction-repair-property",
  "health-wellbeing",
  "education-language-training",
  "travel-tourism",
  "transport-services",
  "logistics-delivery",
  "technology-it",
  "media-communication",
  "beauty-personal-services",
  "culture-community",
  "children-youth-family",
  "sports-recreation",
  "religious-traditional",
  "charity-volunteering-support",
  "business-professional-networks",
  "information-websites-digital-resources",
  "other",
]);
const CONNECTIONS = new Set([
  "majority-nepali-owned",
  "partly-nepali-owned",
  "nepali-founded",
  "nepali-led",
  "nepal-related-organization",
  "nepali-language-service",
  "nepali-products-food-culture",
  "serves-nepali-community",
  "works-with-nepal",
  "nepal-based-serving-norway",
  "relevant-digital-resource",
  "other",
]);
const SERVICE_LANGUAGES = new Set(["nepali", "norwegian", "english", "other"]);
const PRESENCE_TYPES = new Set([
  "physical",
  "online-only",
  "physical-and-online",
  "no-public-location",
]);
const COUNTIES = new Set([
  "agder",
  "akershus",
  "buskerud",
  "finnmark",
  "innlandet",
  "more-og-romsdal",
  "nordland",
  "oslo",
  "rogaland",
  "telemark",
  "troms",
  "trondelag",
  "vestfold",
  "vestland",
  "ostfold",
]);
const COVERAGE_MODES = new Set([
  "local-area",
  "selected-municipalities",
  "selected-counties",
  "nationwide-norway",
  "online-norway",
  "norway-and-nepal",
  "nepal",
  "international",
  "other",
]);

const limits: Record<string, number> = {
  otherSubmissionLanguage: 80,
  applicantName: 120,
  applicantEmail: 254,
  applicantPhone: 40,
  otherPreferredContactLanguage: 80,
  otherApplicantRelationship: 160,
  authorityExplanation: 1000,
  proposedName: 160,
  otherListingType: 160,
  otherCategory: 160,
  organizationNumber: 20,
  entityExplanationWithoutOrganizationNumber: 1000,
  connectionExplanation: 1000,
  ownershipLeadershipExplanation: 1500,
  summary: 600,
  descriptionPlainText: 10000,
  publicWebsite: 2048,
  publicEmail: 254,
  publicPhone: 40,
  publicContactRole: 120,
  country: 120,
  municipality: 120,
  city: 120,
  streetAddress: 200,
  postalCode: 20,
  mapUrl: 2048,
  otherCoverage: 300,
  facebookUrl: 2048,
  instagramUrl: 2048,
  linkedInUrl: 2048,
  proposedLogoUrl: 2048,
  proposedCoverImageUrl: 2048,
  imageAltSuggestion: 300,
  imageCredit: 200,
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const cleanString = (value: unknown) =>
  typeof value === "string" ? value.trim().replace(/\r\n?/g, "\n") : undefined;

const isHttpUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
};

const isEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;

export const validateDirectorySubmission = (
  payload: unknown,
): DirectoryValidationResult => {
  if (!isRecord(payload)) {
    return {
      ok: false,
      errors: [
        {
          field: "$",
          code: "invalid_type",
          message: "The payload must be an object.",
        },
      ],
    };
  }

  if (cleanString(payload.website))
    return { ok: false, spam: true, errors: [] };

  const errors: DirectoryValidationError[] = [];
  const result: Record<string, unknown> = {};
  const addError = (field: string, code: string, message: string) => {
    if (errors.length < 40) errors.push({ field, code, message });
  };

  for (const key of Object.keys(payload)) {
    if (!ALLOWED_FIELDS.has(key))
      addError(key, "unknown_field", "This field is not accepted.");
  }

  const requiredString = (field: string, min = 1) => {
    const value = cleanString(payload[field]);
    if (!value) {
      addError(field, "required", "This field is required.");
      return undefined;
    }
    if (value.length < min)
      addError(field, "too_short", `Use at least ${min} characters.`);
    if (value.length > limits[field])
      addError(field, "too_long", "This field is too long.");
    result[field] = value;
    return value;
  };

  const optionalString = (field: string) => {
    const value = cleanString(payload[field]);
    if (!value) return undefined;
    if (value.length > limits[field])
      addError(field, "too_long", "This field is too long.");
    result[field] = value;
    return value;
  };

  const requiredEnum = (field: string, values: Set<string>) => {
    const value = cleanString(payload[field]);
    if (!value) {
      addError(field, "required", "This field is required.");
      return undefined;
    }
    if (!values.has(value))
      addError(field, "invalid_choice", "Select a supported value.");
    result[field] = value;
    return value;
  };

  const requiredBoolean = (field: string) => {
    const value = payload[field];
    if (typeof value !== "boolean") {
      addError(field, "invalid_type", "This field must be true or false.");
      return undefined;
    }
    result[field] = value;
    return value;
  };

  const requiredTrue = (field: string) => {
    const value = payload[field];
    if (value !== true)
      addError(field, "confirmation_required", "Confirmation is required.");
    result[field] = value;
  };

  const optionalUrl = (field: string) => {
    const value = optionalString(field);
    if (value && !isHttpUrl(value))
      addError(field, "invalid_url", "Use a valid HTTP or HTTPS URL.");
    return value;
  };

  const controlledArray = (
    field: string,
    values: Set<string>,
    minimum: number,
    maximum: number,
  ) => {
    const raw = payload[field];
    const normalized: string[] = [];
    if (raw === undefined && minimum === 0) return normalized;
    if (!Array.isArray(raw)) {
      addError(field, "invalid_type", "This field must be a list.");
      result[field] = normalized;
      return normalized;
    }
    for (const item of raw) {
      if (typeof item !== "string" || !values.has(item)) {
        addError(field, "invalid_choice", "Select supported values only.");
        continue;
      }
      if (!normalized.includes(item)) normalized.push(item);
    }
    if (normalized.length < minimum)
      addError(field, "required", "Select at least one value.");
    if (normalized.length > maximum)
      addError(field, "too_many", "Too many values were supplied.");
    result[field] = normalized;
    return normalized;
  };

  const freeTextArray = (
    field: string,
    maximumItems: number,
    maximumLength: number,
  ) => {
    const raw = payload[field];
    if (raw === undefined) return [];
    if (!Array.isArray(raw)) {
      addError(field, "invalid_type", "This field must be a list.");
      return [];
    }
    const normalized: string[] = [];
    for (const item of raw) {
      const value = cleanString(item);
      if (!value) continue;
      if (value.length > maximumLength) {
        addError(field, "too_long", "One of the supplied values is too long.");
        continue;
      }
      if (!normalized.includes(value)) normalized.push(value);
    }
    if (normalized.length > maximumItems)
      addError(field, "too_many", "Too many values were supplied.");
    if (normalized.length > 0) result[field] = normalized;
    return normalized;
  };

  requiredEnum("formInterfaceLanguage", INTERFACE_LANGUAGES);
  const submissionLanguage = requiredEnum(
    "submissionLanguage",
    SUBMISSION_LANGUAGES,
  );
  const otherSubmissionLanguage = optionalString("otherSubmissionLanguage");
  requiredEnum("requestedPublicLanguage", PUBLIC_LANGUAGES);
  requiredString("applicantName", 2);
  const applicantEmail = requiredString("applicantEmail");
  optionalString("applicantPhone");
  const preferredContactLanguage = requiredEnum(
    "preferredContactLanguage",
    SUBMISSION_LANGUAGES,
  );
  const otherPreferredContactLanguage = optionalString(
    "otherPreferredContactLanguage",
  );
  const applicantRelationship = requiredEnum(
    "applicantRelationship",
    RELATIONSHIPS,
  );
  const otherApplicantRelationship = optionalString(
    "otherApplicantRelationship",
  );
  requiredString("authorityExplanation", 20);

  if (applicantEmail && !isEmail(applicantEmail)) {
    addError("applicantEmail", "invalid_email", "Use a valid email address.");
  }
  if (submissionLanguage === "other" && !otherSubmissionLanguage) {
    addError(
      "otherSubmissionLanguage",
      "required",
      "Specify the submission language.",
    );
  }
  if (submissionLanguage !== "other" && otherSubmissionLanguage) {
    addError(
      "otherSubmissionLanguage",
      "not_applicable",
      "Remove the other language value.",
    );
  }
  if (preferredContactLanguage === "other" && !otherPreferredContactLanguage) {
    addError(
      "otherPreferredContactLanguage",
      "required",
      "Specify the preferred contact language.",
    );
  }
  if (preferredContactLanguage !== "other" && otherPreferredContactLanguage) {
    addError(
      "otherPreferredContactLanguage",
      "not_applicable",
      "Remove the other language value.",
    );
  }
  if (applicantRelationship === "other" && !otherApplicantRelationship) {
    addError(
      "otherApplicantRelationship",
      "required",
      "Describe the applicant relationship.",
    );
  }
  if (applicantRelationship !== "other" && otherApplicantRelationship) {
    addError(
      "otherApplicantRelationship",
      "not_applicable",
      "Remove the other relationship value.",
    );
  }

  requiredString("proposedName", 2);
  const listingType = requiredEnum("listingType", LISTING_TYPES);
  const otherListingType = optionalString("otherListingType");
  const primaryCategory = requiredEnum("primaryCategory", CATEGORIES);
  const otherCategory = optionalString("otherCategory");
  const organizationNumber = optionalString("organizationNumber");
  const noOrganizationExplanation = optionalString(
    "entityExplanationWithoutOrganizationNumber",
  );

  if (listingType === "other" && !otherListingType)
    addError(
      "otherListingType",
      "required",
      "Describe the other listing type.",
    );
  if (listingType !== "other" && otherListingType)
    addError(
      "otherListingType",
      "not_applicable",
      "Remove the other listing type value.",
    );
  if (primaryCategory === "other" && !otherCategory)
    addError("otherCategory", "required", "Describe the other category.");
  if (primaryCategory !== "other" && otherCategory)
    addError(
      "otherCategory",
      "not_applicable",
      "Remove the other category value.",
    );
  if (organizationNumber) {
    const normalized = organizationNumber.replace(/\s/g, "");
    if (!/^\d{9}$/.test(normalized))
      addError(
        "organizationNumber",
        "invalid_format",
        "Use a valid nine-digit organization number.",
      );
    result.organizationNumber = normalized;
    if (noOrganizationExplanation)
      addError(
        "entityExplanationWithoutOrganizationNumber",
        "not_applicable",
        "Remove this explanation when an organization number is supplied.",
      );
  } else if (!noOrganizationExplanation) {
    addError(
      "entityExplanationWithoutOrganizationNumber",
      "required",
      "Explain the entity type and basis for inclusion.",
    );
  }

  controlledArray("communityConnections", CONNECTIONS, 1, 12);
  requiredString("connectionExplanation", 20);
  optionalString("ownershipLeadershipExplanation");
  const selectedServiceLanguages = controlledArray(
    "serviceLanguages",
    SERVICE_LANGUAGES,
    1,
    4,
  );
  const otherServiceLanguages = freeTextArray("otherServiceLanguages", 10, 80);
  if (
    selectedServiceLanguages.includes("other") &&
    otherServiceLanguages.length === 0
  ) {
    addError(
      "otherServiceLanguages",
      "required",
      "Add at least one other service language.",
    );
  }
  if (
    !selectedServiceLanguages.includes("other") &&
    otherServiceLanguages.length > 0
  ) {
    addError(
      "otherServiceLanguages",
      "not_applicable",
      "Remove other service languages.",
    );
  }

  requiredString("summary", 30);
  requiredString("descriptionPlainText", 80);
  const publicWebsite = optionalUrl("publicWebsite");
  const publicEmail = optionalString("publicEmail");
  const publicPhone = optionalString("publicPhone");
  const publicContactRole = optionalString("publicContactRole");
  const publicContactPermission = requiredBoolean("publicContactPermission");
  if (publicEmail && !isEmail(publicEmail))
    addError("publicEmail", "invalid_email", "Use a valid email address.");
  if (listingType === "website-digital-resource" && !publicWebsite) {
    addError(
      "publicWebsite",
      "required",
      "A website or digital-resource listing requires a public website.",
    );
  }
  if (
    (publicEmail || publicPhone || publicContactRole) &&
    publicContactPermission !== true
  ) {
    addError(
      "publicContactPermission",
      "permission_required",
      "Permission is required for proposed public contact details.",
    );
  }

  const presenceType = requiredEnum("presenceType", PRESENCE_TYPES);
  const country = optionalString("country");
  const county = optionalString("county");
  const municipality = optionalString("municipality");
  const city = optionalString("city");
  const streetAddress = optionalString("streetAddress");
  const postalCode = optionalString("postalCode");
  const mapUrl = optionalUrl("mapUrl");
  const addressPublicationPermission = requiredBoolean(
    "addressPublicationPermission",
  );
  const isPhysical =
    presenceType === "physical" || presenceType === "physical-and-online";

  if (county && !COUNTIES.has(county))
    addError("county", "invalid_choice", "Select a supported county.");
  if (isPhysical && !country)
    addError("country", "required", "A physical listing requires a country.");
  if (isPhysical && !city)
    addError(
      "city",
      "required",
      "A physical listing requires a city or locality.",
    );
  if (
    !isPhysical &&
    (country ||
      county ||
      municipality ||
      city ||
      streetAddress ||
      postalCode ||
      mapUrl)
  ) {
    addError(
      "presenceType",
      "invalid_combination",
      "Remove physical location details for this presence type.",
    );
  }
  if (streetAddress && addressPublicationPermission !== true) {
    addError(
      "addressPublicationPermission",
      "confirmation_required",
      "Confirm that the address is already publicly presented by the entity.",
    );
  }

  const selectedCoverageModes = controlledArray(
    "coverageModes",
    COVERAGE_MODES,
    1,
    9,
  );
  const serviceCounties = controlledArray("serviceCounties", COUNTIES, 0, 15);
  const serviceMunicipalities = freeTextArray("serviceMunicipalities", 50, 120);
  const otherCoverage = optionalString("otherCoverage");
  if (
    selectedCoverageModes.includes("selected-counties") &&
    serviceCounties.length === 0
  ) {
    addError(
      "serviceCounties",
      "required",
      "Select at least one service county.",
    );
  }
  if (
    !selectedCoverageModes.includes("selected-counties") &&
    serviceCounties.length > 0
  ) {
    addError(
      "serviceCounties",
      "not_applicable",
      "Remove selected service counties.",
    );
  }
  if (
    selectedCoverageModes.includes("selected-municipalities") &&
    serviceMunicipalities.length === 0
  ) {
    addError(
      "serviceMunicipalities",
      "required",
      "Add at least one service municipality.",
    );
  }
  if (
    !selectedCoverageModes.includes("selected-municipalities") &&
    serviceMunicipalities.length > 0
  ) {
    addError(
      "serviceMunicipalities",
      "not_applicable",
      "Remove selected service municipalities.",
    );
  }
  if (selectedCoverageModes.includes("other") && !otherCoverage)
    addError(
      "otherCoverage",
      "required",
      "Describe the other service coverage.",
    );
  if (!selectedCoverageModes.includes("other") && otherCoverage)
    addError(
      "otherCoverage",
      "not_applicable",
      "Remove the other service coverage value.",
    );

  optionalUrl("facebookUrl");
  optionalUrl("instagramUrl");
  optionalUrl("linkedInUrl");
  const proposedLogoUrl = optionalUrl("proposedLogoUrl");
  const proposedCoverImageUrl = optionalUrl("proposedCoverImageUrl");
  optionalString("imageAltSuggestion");
  optionalString("imageCredit");
  const imagePermissionConfirmed = requiredBoolean("imagePermissionConfirmed");
  if (
    (proposedLogoUrl || proposedCoverImageUrl) &&
    imagePermissionConfirmed !== true
  ) {
    addError(
      "imagePermissionConfirmed",
      "permission_required",
      "Image permission is required.",
    );
  }

  requiredTrue("legitimateBasisConfirmed");
  requiredTrue("connectionClaimsConfirmed");
  requiredTrue("accuracyConfirmed");
  requiredTrue("editingTranslationAccepted");
  requiredTrue("publicationNotGuaranteedAccepted");
  requiredTrue("privacyRetentionAccepted");

  if (errors.length > 0) return { ok: false, errors };
  delete result.website;
  return { ok: true, data: result as DirectorySubmissionInput };
};
