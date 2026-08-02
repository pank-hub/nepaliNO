import type { DirectorySubmissionInput } from "./validateDirectorySubmission";

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const NOTIFICATION_FROM =
  "Nepali.no Notifications <directory@notifications.nepali.no>";
const MODERATION_URL = "https://nepali-no-studio.vercel.app/event-moderation/";

export type DirectorySubmissionNotification = {
  submissionId: string;
  submittedAt: string;
  input: DirectorySubmissionInput;
};

export type DirectoryNotificationResult =
  | { ok: true; providerMessageId: string | null }
  | {
      ok: false;
      reason: "not_configured" | "provider_rejected" | "request_failed";
    };

const singleLine = (value: string) => value.replace(/[\r\n]+/g, " ").trim();

export const notifyDirectorySubmission = async ({
  submissionId,
  submittedAt,
  input,
}: DirectorySubmissionNotification): Promise<DirectoryNotificationResult> => {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const recipient = process.env.DIRECTORY_SUBMISSION_NOTIFICATION_TO?.trim();

  if (!apiKey || !recipient) return { ok: false, reason: "not_configured" };

  const name = singleLine(input.proposedName);
  const subject = `New Community Directory submission: ${name}`.slice(0, 180);
  const text = [
    "A new Community Directory submission has been stored for moderation.",
    "",
    `Proposed listing: ${name}`,
    `Listing type: ${input.listingType}`,
    `Applicant relationship: ${input.applicantRelationship}`,
    `Received: ${submittedAt}`,
    `Submission reference: ${submissionId}`,
    "",
    `Open Submission Moderation: ${MODERATION_URL}`,
    "",
    "This notification intentionally excludes private contact details and the full submission.",
  ].join("\n");

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      signal: AbortSignal.timeout(5000),
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: NOTIFICATION_FROM,
        to: [recipient],
        subject,
        text,
      }),
    });

    if (!response.ok) return { ok: false, reason: "provider_rejected" };

    const responseBody: unknown = await response.json().catch(() => null);
    const providerMessageId =
      responseBody &&
      typeof responseBody === "object" &&
      "id" in responseBody &&
      typeof responseBody.id === "string"
        ? responseBody.id
        : null;

    return { ok: true, providerMessageId };
  } catch {
    return { ok: false, reason: "request_failed" };
  }
};
