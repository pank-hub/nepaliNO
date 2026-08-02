import { createClient } from "@sanity/client";
import type { DirectorySubmissionInput } from "./validateDirectorySubmission";

const PROJECT_ID = "f9johco4";
const DATASET = "submissions";
const API_VERSION = "2026-03-01";

export class DirectorySubmissionStorageUnavailableError extends Error {
  constructor() {
    super("Community Directory submission storage is unavailable.");
    this.name = "DirectorySubmissionStorageUnavailableError";
  }
}

export const createPrivateDirectorySubmission = async (
  input: DirectorySubmissionInput,
) => {
  const token = process.env.SANITY_DIRECTORY_SUBMISSION_TOKEN?.trim();

  if (!token) throw new DirectorySubmissionStorageUnavailableError();

  const client = createClient({
    projectId: PROJECT_ID,
    dataset: DATASET,
    apiVersion: API_VERSION,
    token,
    useCdn: false,
    perspective: "raw",
  });

  const submissionId = crypto.randomUUID();
  const draftId = `drafts.directoryListingSubmission-${submissionId}`;
  const submittedAt = new Date().toISOString();

  await client.create({
    ...input,
    _id: draftId,
    _type: "directoryListingSubmission",
    moderationStatus: "new",
    submittedAt,
  });

  return { submissionId, submittedAt };
};
