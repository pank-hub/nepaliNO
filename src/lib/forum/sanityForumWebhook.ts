import {isValidSignature, SIGNATURE_HEADER_NAME} from '@sanity/webhook'

export class InvalidSanityForumWebhookError extends Error {}

export type SanityForumWebhookIdentity = {
  documentId: string
  documentType: 'newsArticle' | 'publicInformationGuide'
  attemptId: string
}

export const readSanityForumWebhook = async (
  request: Request,
  secret: string,
): Promise<SanityForumWebhookIdentity> => {
  const contentType = request.headers.get('content-type')?.toLowerCase() ?? ''
  if (!contentType.startsWith('application/json')) throw new InvalidSanityForumWebhookError()

  const signature = request.headers.get(SIGNATURE_HEADER_NAME)
  const attemptId = request.headers.get('idempotency-key')?.trim()
  const rawBody = await request.text()
  if (!signature || !attemptId || attemptId.length > 160) throw new InvalidSanityForumWebhookError()
  if (!(await isValidSignature(rawBody, signature, secret))) throw new InvalidSanityForumWebhookError()

  let payload: unknown
  try { payload = JSON.parse(rawBody) } catch { throw new InvalidSanityForumWebhookError() }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new InvalidSanityForumWebhookError()

  const {documentId, documentType} = payload as Record<string, unknown>
  if (
    typeof documentId !== 'string' || !documentId || documentId.startsWith('drafts.') ||
    (documentType !== 'newsArticle' && documentType !== 'publicInformationGuide') ||
    Object.keys(payload).some((key) => key !== 'documentId' && key !== 'documentType')
  ) throw new InvalidSanityForumWebhookError()

  return {documentId, documentType, attemptId}
}
