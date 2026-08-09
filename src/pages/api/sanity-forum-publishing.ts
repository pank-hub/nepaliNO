import type {APIRoute} from 'astro'
import {publishDiscourseCompanionTopic} from '../../lib/forum/discourseCompanionPublisher.ts'
import {createSanityForumPublishingDependencies} from '../../lib/forum/sanityForumAutomationClient.ts'
import {runSanityForumPublishingWorkflow} from '../../lib/forum/sanityForumPublishingWorkflow.ts'
import {InvalidSanityForumWebhookError, readSanityForumWebhook} from '../../lib/forum/sanityForumWebhook.ts'

export const prerender = false
const json = (status: number, body: Record<string, unknown>) => new Response(JSON.stringify(body), {status, headers: {'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff'}})

export const POST: APIRoute = async ({request}) => {
  const secret = import.meta.env.SANITY_FORUM_WEBHOOK_SECRET?.trim()
  if (!secret) return json(503, {ok: false, code: 'temporarily_unavailable'})
  try {
    const identity = await readSanityForumWebhook(request, secret)
    const outcome = await runSanityForumPublishingWorkflow(
      identity,
      createSanityForumPublishingDependencies(publishDiscourseCompanionTopic),
    )
    return json(outcome.code === 'published' ? 201 : 200, {ok: true, ...outcome})
  } catch (error) {
    console.error('Sanity Forum publishing workflow failed', {errorName: error instanceof Error ? error.name : 'UnknownError'})
    if (error instanceof InvalidSanityForumWebhookError) return json(401, {ok: false, code: 'authentication_failed'})
    return json(503, {ok: false, code: 'temporarily_unavailable'})
  }
}

export const ALL: APIRoute = async () => json(405, {ok: false, code: 'method_not_allowed'})
