export type EventSubmissionInput = {
  formInterfaceLanguage: 'ne' | 'nb' | 'en'
  submissionLanguage: 'ne' | 'nb' | 'en' | 'other'
  otherSubmissionLanguage?: string
  requestedPublicLanguage: 'ne' | 'nb' | 'both' | 'editorial-decision'
  organizerName: string
  privateContactName: string
  privateContactEmail: string
  privateContactPhone?: string
  preferredContactLanguage: 'ne' | 'nb' | 'en' | 'other'
  otherPreferredContactLanguage?: string
  publicOrganizerName?: string
  publicOrganizerUrl?: string
  publicOrganizerEmail?: string
  publicOrganizerPhone?: string
  publicContactPermission: boolean
  proposedTitle: string
  summary: string
  descriptionPlainText: string
  eventLanguages: Array<'nepali' | 'norwegian' | 'english' | 'language-independent' | 'other'>
  otherEventLanguage?: string
  eventType:
    | 'cultural-celebration'
    | 'festival'
    | 'concert-artist'
    | 'community-gathering'
    | 'social-meetup'
    | 'student-youth'
    | 'children-family'
    | 'workshop-seminar'
    | 'information-integration'
    | 'sports-recreation'
    | 'religious-traditional'
    | 'charity-volunteering'
    | 'business-networking'
    | 'other'
  eventFormat: 'in-person' | 'online' | 'hybrid'
  isAllDay: boolean
  startDateTime: string
  endDateTime?: string
  venueName?: string
  address?: string
  postalCode?: string
  city?: string
  mapUrl?: string
  onlinePlatform?: string
  onlineInformationUrl?: string
  accessibilityInformation?: string
  transportInformation?: string
  intendedAudience?: string
  sourceUrl?: string
  registrationRequirement: 'not-required' | 'recommended' | 'required' | 'tickets-required'
  registrationStatus: 'not-applicable' | 'not-yet-open' | 'open' | 'closed' | 'sold-out'
  registrationUrl?: string
  registrationDeadline?: string
  isFree: boolean
  priceDescription?: string
  proposedImageUrl?: string
  imageAltSuggestion?: string
  imageCredit?: string
  imagePermissionConfirmed: boolean
  authorityConfirmed: true
  accuracyConfirmed: true
  editingTranslationAccepted: true
  publicationNotGuaranteedAccepted: true
  privacyRetentionAccepted: true
}

export type ValidationError = {
  field: string
  code: string
  message: string
}

export type ValidationResult =
  | {ok: true; data: EventSubmissionInput}
  | {ok: false; errors: ValidationError[]; spam?: boolean}

const ALLOWED_FIELDS = new Set([
  'website',
  'formInterfaceLanguage',
  'submissionLanguage',
  'otherSubmissionLanguage',
  'requestedPublicLanguage',
  'organizerName',
  'privateContactName',
  'privateContactEmail',
  'privateContactPhone',
  'preferredContactLanguage',
  'otherPreferredContactLanguage',
  'publicOrganizerName',
  'publicOrganizerUrl',
  'publicOrganizerEmail',
  'publicOrganizerPhone',
  'publicContactPermission',
  'proposedTitle',
  'summary',
  'descriptionPlainText',
  'eventLanguages',
  'otherEventLanguage',
  'eventType',
  'eventFormat',
  'isAllDay',
  'startDateTime',
  'endDateTime',
  'venueName',
  'address',
  'postalCode',
  'city',
  'mapUrl',
  'onlinePlatform',
  'onlineInformationUrl',
  'accessibilityInformation',
  'transportInformation',
  'intendedAudience',
  'sourceUrl',
  'registrationRequirement',
  'registrationStatus',
  'registrationUrl',
  'registrationDeadline',
  'isFree',
  'priceDescription',
  'proposedImageUrl',
  'imageAltSuggestion',
  'imageCredit',
  'imagePermissionConfirmed',
  'authorityConfirmed',
  'accuracyConfirmed',
  'editingTranslationAccepted',
  'publicationNotGuaranteedAccepted',
  'privacyRetentionAccepted',
])

const INTERFACE_LANGUAGES = new Set(['ne', 'nb', 'en'])
const SUBMISSION_LANGUAGES = new Set(['ne', 'nb', 'en', 'other'])
const PUBLIC_LANGUAGES = new Set(['ne', 'nb', 'both', 'editorial-decision'])
const EVENT_LANGUAGES = new Set([
  'nepali',
  'norwegian',
  'english',
  'language-independent',
  'other',
])
const EVENT_TYPES = new Set([
  'cultural-celebration',
  'festival',
  'concert-artist',
  'community-gathering',
  'social-meetup',
  'student-youth',
  'children-family',
  'workshop-seminar',
  'information-integration',
  'sports-recreation',
  'religious-traditional',
  'charity-volunteering',
  'business-networking',
  'other',
])
const EVENT_FORMATS = new Set(['in-person', 'online', 'hybrid'])
const REGISTRATION_REQUIREMENTS = new Set([
  'not-required',
  'recommended',
  'required',
  'tickets-required',
])
const REGISTRATION_STATUSES = new Set([
  'not-applicable',
  'not-yet-open',
  'open',
  'closed',
  'sold-out',
])

const limits: Record<string, number> = {
  otherSubmissionLanguage: 80,
  organizerName: 150,
  privateContactName: 120,
  privateContactEmail: 254,
  privateContactPhone: 40,
  otherPreferredContactLanguage: 80,
  publicOrganizerName: 150,
  publicOrganizerUrl: 2048,
  publicOrganizerEmail: 254,
  publicOrganizerPhone: 40,
  proposedTitle: 150,
  summary: 600,
  descriptionPlainText: 10000,
  otherEventLanguage: 80,
  startDateTime: 40,
  endDateTime: 40,
  venueName: 180,
  address: 200,
  postalCode: 20,
  city: 100,
  mapUrl: 2048,
  onlinePlatform: 120,
  onlineInformationUrl: 2048,
  accessibilityInformation: 1000,
  transportInformation: 1000,
  intendedAudience: 300,
  sourceUrl: 2048,
  registrationUrl: 2048,
  registrationDeadline: 40,
  priceDescription: 300,
  proposedImageUrl: 2048,
  imageAltSuggestion: 300,
  imageCredit: 200,
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const cleanString = (value: unknown) =>
  typeof value === 'string' ? value.trim().replace(/\r\n?/g, '\n') : undefined

const isHttpUrl = (value: string) => {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

const isEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254

const isIsoDateTime = (value: string) => {
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/,
  )

  if (!match || !Number.isFinite(Date.parse(value))) return false

  const [, yearText, monthText, dayText, hourText, minuteText, secondText = '0'] = match
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)
  const hour = Number(hourText)
  const minute = Number(minuteText)
  const second = Number(secondText)

  if (month < 1 || month > 12 || hour > 23 || minute > 59 || second > 59) return false

  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  return day >= 1 && day <= daysInMonth
}

export const validateEventSubmission = (payload: unknown): ValidationResult => {
  if (!isRecord(payload)) {
    return {
      ok: false,
      errors: [{field: '$', code: 'invalid_type', message: 'The payload must be an object.'}],
    }
  }

  const honeypot = cleanString(payload.website)
  if (honeypot) {
    return {ok: false, spam: true, errors: []}
  }

  const errors: ValidationError[] = []
  const result: Record<string, unknown> = {}

  const addError = (field: string, code: string, message: string) => {
    if (errors.length < 40) errors.push({field, code, message})
  }

  for (const key of Object.keys(payload)) {
    if (!ALLOWED_FIELDS.has(key)) {
      addError(key, 'unknown_field', 'This field is not accepted.')
    }
  }

  const requiredString = (field: string, min = 1) => {
    const value = cleanString(payload[field])
    if (!value) {
      addError(field, 'required', 'This field is required.')
      return undefined
    }
    if (value.length < min) addError(field, 'too_short', `Use at least ${min} characters.`)
    if (value.length > limits[field]) addError(field, 'too_long', 'This field is too long.')
    result[field] = value
    return value
  }

  const optionalString = (field: string) => {
    const value = cleanString(payload[field])
    if (!value) return undefined
    if (value.length > limits[field]) addError(field, 'too_long', 'This field is too long.')
    result[field] = value
    return value
  }

  const requiredEnum = (field: string, values: Set<string>) => {
    const value = cleanString(payload[field])
    if (!value) {
      addError(field, 'required', 'This field is required.')
      return undefined
    }
    if (!values.has(value)) addError(field, 'invalid_choice', 'Select a supported value.')
    result[field] = value
    return value
  }

  const requiredBoolean = (field: string) => {
    const value = payload[field]
    if (typeof value !== 'boolean') {
      addError(field, 'invalid_type', 'This field must be true or false.')
      return undefined
    }
    result[field] = value
    return value
  }

  const requiredTrue = (field: string) => {
    const value = payload[field]
    if (value !== true) addError(field, 'confirmation_required', 'Confirmation is required.')
    result[field] = value
  }

  const optionalUrl = (field: string) => {
    const value = optionalString(field)
    if (value && !isHttpUrl(value)) addError(field, 'invalid_url', 'Use a valid HTTP or HTTPS URL.')
    return value
  }

  requiredEnum('formInterfaceLanguage', INTERFACE_LANGUAGES)
  const submissionLanguage = requiredEnum('submissionLanguage', SUBMISSION_LANGUAGES)
  const otherSubmissionLanguage = optionalString('otherSubmissionLanguage')
  requiredEnum('requestedPublicLanguage', PUBLIC_LANGUAGES)
  requiredString('organizerName', 2)
  requiredString('privateContactName', 2)
  const privateEmail = requiredString('privateContactEmail')
  optionalString('privateContactPhone')
  const preferredContactLanguage = requiredEnum('preferredContactLanguage', SUBMISSION_LANGUAGES)
  const otherPreferredContactLanguage = optionalString('otherPreferredContactLanguage')
  optionalString('publicOrganizerName')
  optionalUrl('publicOrganizerUrl')
  const publicEmail = optionalString('publicOrganizerEmail')
  const publicPhone = optionalString('publicOrganizerPhone')
  const publicContactPermission = requiredBoolean('publicContactPermission')
  requiredString('proposedTitle', 5)
  requiredString('summary', 30)
  requiredString('descriptionPlainText', 80)

  if (privateEmail && !isEmail(privateEmail)) {
    addError('privateContactEmail', 'invalid_email', 'Use a valid email address.')
  }
  if (publicEmail && !isEmail(publicEmail)) {
    addError('publicOrganizerEmail', 'invalid_email', 'Use a valid email address.')
  }

  if (submissionLanguage === 'other' && !otherSubmissionLanguage) {
    addError('otherSubmissionLanguage', 'required', 'Specify the submission language.')
  }
  if (submissionLanguage !== 'other' && otherSubmissionLanguage) {
    addError('otherSubmissionLanguage', 'not_applicable', 'Remove the other language value.')
  }
  if (preferredContactLanguage === 'other' && !otherPreferredContactLanguage) {
    addError('otherPreferredContactLanguage', 'required', 'Specify the preferred contact language.')
  }
  if (preferredContactLanguage !== 'other' && otherPreferredContactLanguage) {
    addError('otherPreferredContactLanguage', 'not_applicable', 'Remove the other language value.')
  }
  if ((publicEmail || publicPhone) && publicContactPermission !== true) {
    addError('publicContactPermission', 'permission_required', 'Permission is required for public contacts.')
  }

  const rawEventLanguages = payload.eventLanguages
  const normalizedEventLanguages: string[] = []
  if (!Array.isArray(rawEventLanguages) || rawEventLanguages.length === 0) {
    addError('eventLanguages', 'required', 'Select at least one Event language.')
  } else {
    for (const value of rawEventLanguages) {
      if (typeof value !== 'string' || !EVENT_LANGUAGES.has(value)) {
        addError('eventLanguages', 'invalid_choice', 'Select supported Event languages only.')
        continue
      }
      if (!normalizedEventLanguages.includes(value)) normalizedEventLanguages.push(value)
    }
    if (normalizedEventLanguages.length > 5) {
      addError('eventLanguages', 'too_many', 'Too many Event languages were supplied.')
    }
    if (
      normalizedEventLanguages.includes('language-independent') &&
      normalizedEventLanguages.length > 1
    ) {
      addError(
        'eventLanguages',
        'invalid_combination',
        'Language-independent cannot be combined with spoken languages.',
      )
    }
  }
  result.eventLanguages = normalizedEventLanguages

  const otherEventLanguage = optionalString('otherEventLanguage')
  if (normalizedEventLanguages.includes('other') && !otherEventLanguage) {
    addError('otherEventLanguage', 'required', 'Specify the other Event language.')
  }
  if (!normalizedEventLanguages.includes('other') && otherEventLanguage) {
    addError('otherEventLanguage', 'not_applicable', 'Remove the other Event language value.')
  }

  requiredEnum('eventType', EVENT_TYPES)
  const eventFormat = requiredEnum('eventFormat', EVENT_FORMATS)
  requiredBoolean('isAllDay')
  const start = requiredString('startDateTime')
  const end = optionalString('endDateTime')

  if (start && !isIsoDateTime(start)) {
    addError('startDateTime', 'invalid_datetime', 'Use an ISO date and time with a timezone.')
  }
  if (end && !isIsoDateTime(end)) {
    addError('endDateTime', 'invalid_datetime', 'Use an ISO date and time with a timezone.')
  }
  if (start && end && isIsoDateTime(start) && isIsoDateTime(end) && Date.parse(end) <= Date.parse(start)) {
    addError('endDateTime', 'invalid_order', 'The end time must be later than the start time.')
  }

  optionalString('venueName')
  optionalString('address')
  optionalString('postalCode')
  const city = optionalString('city')
  optionalUrl('mapUrl')
  const onlinePlatform = optionalString('onlinePlatform')
  const onlineInformationUrl = optionalUrl('onlineInformationUrl')
  optionalString('accessibilityInformation')
  optionalString('transportInformation')
  optionalString('intendedAudience')
  optionalUrl('sourceUrl')

  if ((eventFormat === 'in-person' || eventFormat === 'hybrid') && !city) {
    addError('city', 'required', 'City is required for in-person or hybrid Events.')
  }
  if ((eventFormat === 'online' || eventFormat === 'hybrid') && !onlinePlatform && !onlineInformationUrl) {
    addError('onlinePlatform', 'required', 'Provide an online platform or public information URL.')
  }

  const registrationRequirement = requiredEnum(
    'registrationRequirement',
    REGISTRATION_REQUIREMENTS,
  )
  const registrationStatus = requiredEnum('registrationStatus', REGISTRATION_STATUSES)
  const registrationUrl = optionalUrl('registrationUrl')
  const registrationDeadline = optionalString('registrationDeadline')
  const isFree = requiredBoolean('isFree')
  const priceDescription = optionalString('priceDescription')

  if (registrationDeadline && !isIsoDateTime(registrationDeadline)) {
    addError(
      'registrationDeadline',
      'invalid_datetime',
      'Use an ISO date and time with a timezone.',
    )
  }
  if (registrationRequirement === 'not-required' && registrationStatus !== 'not-applicable') {
    addError(
      'registrationStatus',
      'invalid_combination',
      'Registration status must be Not applicable when registration is not required.',
    )
  }
  if (registrationRequirement !== 'not-required' && registrationStatus === 'not-applicable') {
    addError('registrationStatus', 'invalid_combination', 'Select the current registration status.')
  }
  if (registrationRequirement === 'not-required' && (registrationUrl || registrationDeadline)) {
    addError('registrationUrl', 'not_applicable', 'Remove registration details when registration is not required.')
  }
  if (isFree === false && !priceDescription) {
    addError('priceDescription', 'required', 'Describe the Event price.')
  }
  if (isFree === true && priceDescription) {
    addError('priceDescription', 'not_applicable', 'Remove the price description for a free Event.')
  }

  const proposedImageUrl = optionalUrl('proposedImageUrl')
  optionalString('imageAltSuggestion')
  optionalString('imageCredit')
  const imagePermissionConfirmed = requiredBoolean('imagePermissionConfirmed')
  if (proposedImageUrl && imagePermissionConfirmed !== true) {
    addError('imagePermissionConfirmed', 'permission_required', 'Image permission is required.')
  }

  requiredTrue('authorityConfirmed')
  requiredTrue('accuracyConfirmed')
  requiredTrue('editingTranslationAccepted')
  requiredTrue('publicationNotGuaranteedAccepted')
  requiredTrue('privacyRetentionAccepted')

  if (errors.length > 0) return {ok: false, errors}

  delete result.website
  return {ok: true, data: result as EventSubmissionInput}
}
