import {createClient} from '@sanity/client'
import type {EventSubmissionInput} from './validateEventSubmission'

const PROJECT_ID = 'f9johco4'
const DATASET = 'submissions'
const API_VERSION = '2026-03-01'

export class SubmissionStorageUnavailableError extends Error {
  constructor() {
    super('Event submission storage is unavailable.')
    this.name = 'SubmissionStorageUnavailableError'
  }
}

export const createPrivateEventSubmission = async (input: EventSubmissionInput) => {
  const token = process.env.SANITY_EVENT_SUBMISSION_TOKEN?.trim()

  if (!token) {
    throw new SubmissionStorageUnavailableError()
  }

  const client = createClient({
    projectId: PROJECT_ID,
    dataset: DATASET,
    apiVersion: API_VERSION,
    token,
    useCdn: false,
    perspective: 'raw',
  })

  const submissionId = crypto.randomUUID()
  const draftId = `drafts.eventSubmission-${submissionId}`
  const submittedAt = new Date().toISOString()

  await client.create({
    ...input,
    _id: draftId,
    _type: 'eventSubmission',
    moderationStatus: 'new',
    submittedAt,
  })

  return {
    submissionId,
    submittedAt,
  }
}
