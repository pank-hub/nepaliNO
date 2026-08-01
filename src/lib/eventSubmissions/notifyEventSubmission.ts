import type {EventSubmissionInput} from './validateEventSubmission'

const RESEND_ENDPOINT = 'https://api.resend.com/emails'
const NOTIFICATION_FROM = 'Nepali.no Notifications <events@notifications.nepali.no>'
const MODERATION_URL = 'https://nepali-no-studio.vercel.app/event-moderation/'

export type EventSubmissionNotification = {
  submissionId: string
  submittedAt: string
  input: EventSubmissionInput
}

export type NotificationResult =
  | {ok: true; providerMessageId: string | null}
  | {ok: false; reason: 'not_configured' | 'provider_rejected' | 'request_failed'}

const singleLine = (value: string) => value.replace(/[\r\n]+/g, ' ').trim()

export const notifyEventSubmission = async ({
  submissionId,
  submittedAt,
  input,
}: EventSubmissionNotification): Promise<NotificationResult> => {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  const recipient = process.env.EVENT_SUBMISSION_NOTIFICATION_TO?.trim()

  if (!apiKey || !recipient) {
    return {ok: false, reason: 'not_configured'}
  }

  const title = singleLine(input.proposedTitle)
  const organizer = singleLine(input.organizerName)
  const subject = `New Event submission: ${title}`.slice(0, 180)
  const text = [
    'A new Event submission has been stored for moderation.',
    '',
    `Event title: ${title}`,
    `Organizer: ${organizer}`,
    `Received: ${submittedAt}`,
    `Submission reference: ${submissionId}`,
    '',
    `Open Event Moderation: ${MODERATION_URL}`,
    '',
    'This notification intentionally excludes private contact details and the full submission.',
  ].join('\n')

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      signal: AbortSignal.timeout(5000),
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: NOTIFICATION_FROM,
        to: [recipient],
        subject,
        text,
      }),
    })

    if (!response.ok) {
      return {ok: false, reason: 'provider_rejected'}
    }

    const responseBody: unknown = await response.json().catch(() => null)
    const providerMessageId =
      responseBody &&
      typeof responseBody === 'object' &&
      'id' in responseBody &&
      typeof responseBody.id === 'string'
        ? responseBody.id
        : null

    return {ok: true, providerMessageId}
  } catch {
    return {ok: false, reason: 'request_failed'}
  }
}
