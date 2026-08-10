import {forumPilot} from '../../config/forum.ts'
import {
  guideQuestionsCategoryId,
  newsDiscussionCategoryId,
} from './forumTopicEligibility.ts'

const REQUEST_TIMEOUT_MS = 5_000

export type CompanionPublicationInput =
  | {
      contentType: 'newsArticle'
      language: 'ne' | 'nb'
      title: string
      url: string
    }
  | {
      contentType: 'publicInformationGuide'
      language: 'ne' | 'nb'
      title: string
      url: string
    }

export interface CompanionTopicDraft {
  title: string
  raw: string
  category: number
}

export interface PublishedCompanionTopic {
  topicId: number
  topicUrl: string
  categoryId: number
}

export class DiscoursePublisherConfigurationError extends Error {}
export class DiscoursePublisherRequestError extends Error {}
export class DiscoursePublisherRejectedError extends Error {
  readonly safeFailureCode: DiscoursePublisherRejectionCode

  constructor(safeFailureCode: DiscoursePublisherRejectionCode) {
    super('The Forum rejected the publishing request.')
    this.name = 'DiscoursePublisherRejectedError'
    this.safeFailureCode = safeFailureCode
  }
}

export type DiscoursePublisherRejectionCode =
  | 'forum-publishing-rejected-title'
  | 'forum-publishing-rejected-post'
  | 'forum-publishing-rejected-category'
  | 'forum-publishing-rejected-tags'
  | 'forum-publishing-rejected-validation'

export type DiscoursePublisherFetch = typeof fetch

const readRequiredPublisherEnvironmentVariable = (name: keyof ImportMetaEnv) => {
  const value = import.meta.env[name]?.trim()

  if (!value) {
    throw new DiscoursePublisherConfigurationError(
      `Missing required Forum publisher configuration: ${name}`,
    )
  }

  return value
}

const isValidTitle = (title: string) => {
  const normalized = title.trim()
  return normalized.length >= 10 && normalized.length <= 160
}

const readPublicContentUrl = (value: string) => {
  let url: URL

  try {
    url = new URL(value)
  } catch {
    throw new TypeError('Forum companion content URL is invalid.')
  }

  if (url.protocol !== 'https:' || url.hostname !== 'nepali.no') {
    throw new TypeError('Forum companion content URL is invalid.')
  }

  return url.toString()
}

const buildOpeningPost = (input: CompanionPublicationInput, url: string) => {
  if (input.contentType === 'newsArticle') {
    return input.language === 'ne'
      ? `यो छलफल nepali.no मा प्रकाशित समाचारसँग सम्बन्धित छ।\n\nपूरा समाचार पढ्नुहोस्:\n${url}\n\nसमाचारबारे छलफल गर्न, थप प्रश्न सोध्न वा सान्दर्भिक जानकारी साझा गर्न यो फोरम विषय प्रयोग गर्नुहोस्।\n\nसमुदायका योगदानहरू प्रमाणित पत्रकारिता होइनन् र तिनले nepali.no को धारणा प्रतिनिधित्व नगर्न सक्छन्।`
      : `Denne diskusjonen er knyttet til en nyhetsartikkel publisert på nepali.no.\n\nLes hele artikkelen:\n${url}\n\nBruk denne tråden til å diskutere artikkelen, stille oppfølgingsspørsmål eller dele relevant informasjon.\n\nBidrag fra fellesskapet er ikke verifisert journalistikk og representerer ikke nødvendigvis nepali.no.`
  }

  return input.language === 'ne'
    ? `यो छलफल nepali.no को सार्वजनिक जानकारी गाइडसँग सम्बन्धित छ।\n\nपूरा गाइड र आधिकारिक स्रोतहरू पढ्नुहोस्:\n${url}\n\nथप प्रश्न सोध्न र व्यावहारिक अनुभव साझा गर्न यो फोरम विषय प्रयोग गर्नुहोस्।\n\nफोरमका जवाफहरू समुदायका योगदान हुन्। तिनले गाइड, आधिकारिक जानकारी वा व्यक्तिगत व्यावसायिक सल्लाहलाई प्रतिस्थापन गर्दैनन्।`
    : `Denne diskusjonen er knyttet til en offentlig informasjonsguide på nepali.no.\n\nLes hele guiden og de offisielle kildene:\n${url}\n\nBruk denne tråden til å stille tilleggsspørsmål og dele praktiske erfaringer.\n\nSvar i forumet er bidrag fra fellesskapet. De erstatter ikke guiden, offentlig informasjon eller individuell faglig rådgivning.`
}

export const buildCompanionTopicDraft = (
  input: CompanionPublicationInput,
): CompanionTopicDraft => {
  if (!isValidTitle(input.title)) {
    throw new TypeError('Forum companion title is invalid.')
  }

  if (
    input.contentType !== 'newsArticle' &&
    input.contentType !== 'publicInformationGuide'
  ) {
    throw new TypeError('Forum companion content type is invalid.')
  }

  if (input.language !== 'ne' && input.language !== 'nb') {
    throw new TypeError('Forum companion language is invalid.')
  }

  const url = readPublicContentUrl(input.url)
  const category =
    input.contentType === 'newsArticle'
      ? newsDiscussionCategoryId
      : guideQuestionsCategoryId

  return {
    title: input.title.trim(),
    raw: buildOpeningPost(input, url),
    category,
  }
}

const readPositiveInteger = (value: unknown) =>
  typeof value === 'number' && Number.isInteger(value) && value > 0
    ? value
    : undefined

const collectSafeValidationText = (payload: unknown) => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return ''

  const result = payload as Record<string, unknown>
  const values = [result.error_type, result.message]
  if (Array.isArray(result.errors)) values.push(...result.errors)

  return values
    .filter((value): value is string => typeof value === 'string')
    .join(' ')
    .toLocaleLowerCase('en')
}

export const classifyDiscoursePublisherRejection = (
  status: number,
  payload: unknown,
): DiscoursePublisherRejectionCode | undefined => {
  if (status !== 422) return undefined

  const text = collectSafeValidationText(payload)
  if (/title|topic title/.test(text)) return 'forum-publishing-rejected-title'
  if (/post|body|raw|content/.test(text)) return 'forum-publishing-rejected-post'
  if (/categor/.test(text)) return 'forum-publishing-rejected-category'
  if (/tag/.test(text)) return 'forum-publishing-rejected-tags'
  return 'forum-publishing-rejected-validation'
}

export const publishDiscourseCompanionTopic = async (
  input: CompanionPublicationInput,
  publisherFetch: DiscoursePublisherFetch = fetch,
): Promise<PublishedCompanionTopic> => {
  const draft = buildCompanionTopicDraft(input)
  const apiKey = readRequiredPublisherEnvironmentVariable(
    'DISCOURSE_FORUM_PUBLISHER_API_KEY',
  )
  const apiUsername = readRequiredPublisherEnvironmentVariable(
    'DISCOURSE_FORUM_PUBLISHER_API_USERNAME',
  )
  const endpoint = new URL('/posts.json', forumPilot.url)

  let response: Response

  try {
    response = await publisherFetch(endpoint, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': apiKey,
        'api-username': apiUsername,
      },
      body: JSON.stringify(draft),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch (error) {
    throw new DiscoursePublisherRequestError(
      error instanceof Error && error.name === 'TimeoutError'
        ? 'The Forum publishing request timed out.'
        : 'The Forum publishing request failed.',
    )
  }

  let payload: unknown

  try {
    payload = await response.json()
  } catch {
    if (!response.ok) {
      throw new DiscoursePublisherRequestError(
        `The Forum publishing request returned HTTP ${response.status}.`,
      )
    }
    throw new DiscoursePublisherRequestError(
      'The Forum returned an invalid publishing response.',
    )
  }

  if (!response.ok) {
    const safeFailureCode = classifyDiscoursePublisherRejection(
      response.status,
      payload,
    )
    if (safeFailureCode) throw new DiscoursePublisherRejectedError(safeFailureCode)

    throw new DiscoursePublisherRequestError(
      `The Forum publishing request returned HTTP ${response.status}.`,
    )
  }

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new DiscoursePublisherRequestError(
      'The Forum returned an invalid publishing object.',
    )
  }

  const result = payload as Record<string, unknown>
  const topicId = readPositiveInteger(result.topic_id)

  if (!topicId) {
    throw new DiscoursePublisherRequestError(
      'The Forum publishing response did not contain a valid topic ID.',
    )
  }

  return {
    topicId,
    topicUrl: new URL(`/t/${topicId}`, forumPilot.url).toString(),
    categoryId: draft.category,
  }
}
