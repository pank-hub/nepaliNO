// TEMPORARY (PR #112 hosted acceptance): remove with src/pages/dev/entur-acceptance.astro before merge.
// Controlled client-side probe of the real /api/entur/origins rate limit. It runs only on an explicit
// click, never sends more than MAX_REQUESTS and renders only statuses, a stable error code and Retry-After.

export const PROBE_ENDPOINT = '/api/entur/origins'
export const PROBE_QUERY = 'Oslo S'
export const MAX_REQUESTS = 21
export const DEFAULT_RETRY_AFTER_SECONDS = 60

// The limiter uses epoch-aligned 60 s buckets; a burst that crosses a boundary can pass 21 requests.
// Runs therefore start only 5-25 s into a minute, stop issuing requests after 50 s and time out each
// request after 5 s, so the last response arrives before 55 s.
export const WINDOW_MS = 60_000
export const SAFE_START_MIN_MS = 5_000
export const SAFE_START_MAX_MS = 25_000
export const RUN_DEADLINE_MS = 50_000
export const REQUEST_TIMEOUT_MS = 5_000

export const isSafeStart = (now: number): boolean => {
  const position = now % WINDOW_MS
  return position >= SAFE_START_MIN_MS && position <= SAFE_START_MAX_MS
}

export const msUntilSafeStart = (now: number): number => {
  const position = now % WINDOW_MS
  if (position < SAFE_START_MIN_MS) return SAFE_START_MIN_MS - position
  return position > SAFE_START_MAX_MS ? WINDOW_MS - position + SAFE_START_MIN_MS : 0
}

export type ProbeFetch = (input: string, init: RequestInit) => Promise<Response>

export interface ProbeResult {
  status: number
  code?: string
  retryAfterSeconds?: number
}

export interface ProbeRun {
  sent: number
  statuses: number[]
  limited?: ProbeResult
  stoppedByDeadline?: boolean
}

const sendOne = async (fetchImpl: ProbeFetch): Promise<ProbeResult> => {
  let response: Response
  try {
    response = await fetchImpl(PROBE_ENDPOINT, {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({query: PROBE_QUERY}),
      cache: 'no-store',
      credentials: 'same-origin',
      redirect: 'manual',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch {
    return {status: 0, code: 'network_error'}
  }
  if (response.status === 200) {
    await response.body?.cancel()
    return {status: 200}
  }
  let code: string | undefined
  try {
    const data: unknown = await response.json()
    const value = typeof data === 'object' && data !== null ? (data as {code?: unknown}).code : undefined
    if (typeof value === 'string' && /^[a-z_]{1,40}$/.test(value)) code = value
  } catch {
    // Only the stable code is ever displayed.
  }
  const header = response.headers.get('retry-after')
  const parsed = header !== null && /^\d{1,6}$/.test(header.trim()) ? Number(header) : undefined
  return {status: response.status, code, retryAfterSeconds: parsed}
}

// Sequential; stops at the first 429 or at the first unexpected status, never above MAX_REQUESTS,
// and never sends once the start minute is over or 50 s into it. The caller must check isSafeStart first.
export async function runRateLimitProbe(
  fetchImpl: ProbeFetch,
  onResult: (index: number, result: ProbeResult) => void = () => {},
  now: () => number = Date.now,
): Promise<ProbeRun> {
  const run: ProbeRun = {sent: 0, statuses: []}
  const startMinute = Math.floor(now() / WINDOW_MS)
  while (run.sent < MAX_REQUESTS) {
    const current = now()
    if (Math.floor(current / WINDOW_MS) !== startMinute || current % WINDOW_MS >= RUN_DEADLINE_MS) {
      run.stoppedByDeadline = true
      break
    }
    const result = await sendOne(fetchImpl)
    run.sent += 1
    run.statuses.push(result.status)
    onResult(run.sent, result)
    if (result.status === 429) {
      run.limited = result
      break
    }
    if (result.status !== 200) break
  }
  return run
}

export const sendRecoveryRequest = (fetchImpl: ProbeFetch): Promise<ProbeResult> => sendOne(fetchImpl)

export interface ProbeTimers {
  setInterval: (callback: () => void, ms: number) => unknown
  clearInterval: (handle: unknown) => void
}

const find = (root: ParentNode, name: string): HTMLElement => {
  const element = root.querySelector<HTMLElement>(`[data-probe="${name}"]`)
  if (!element) throw new Error(`missing probe element: ${name}`)
  return element
}

// Wires the fixture markup. Nothing runs until a button is clicked; all output uses textContent.
export function mountRateLimitProbe(
  root: ParentNode,
  fetchImpl: ProbeFetch,
  timers: ProbeTimers = {setInterval: (cb, ms) => setInterval(cb, ms), clearInterval: (h) => clearInterval(h as number)},
  now: () => number = Date.now,
): void {
  const run = find(root, 'run') as HTMLButtonElement
  const recover = find(root, 'recover') as HTMLButtonElement
  const log = find(root, 'log')
  const summary = find(root, 'summary')
  const first429 = find(root, 'first-429')
  const retryAfter = find(root, 'retry-after')
  const recovery = find(root, 'recovery-result')
  const windowStatus = find(root, 'window-status')
  let busy = false

  // Outside the safe part of the minute nothing is sent; the button re-enables when it is safe again.
  const waitForSafeStart = () => {
    run.disabled = true
    const show = () => {
      const seconds = Math.ceil(msUntilSafeStart(now()) / 1000)
      windowStatus.textContent = `Not in the safe start interval (5-25 s into the minute). Safe to start in ${seconds} s.`
    }
    show()
    const handle = timers.setInterval(() => {
      if (msUntilSafeStart(now()) > 0) return show()
      timers.clearInterval(handle)
      windowStatus.textContent = 'Safe to start now. Click the button to run the test.'
      run.disabled = false
    }, 1000)
  }

  run.addEventListener('click', async () => {
    if (busy || run.disabled) return
    if (!isSafeStart(now())) return waitForSafeStart()
    windowStatus.textContent = ''
    busy = true
    run.disabled = true
    recover.disabled = true
    for (const element of [log, summary, first429, retryAfter, recovery]) element.textContent = ''
    const result = await runRateLimitProbe(fetchImpl, (index, item) => {
      const line = log.ownerDocument.createElement('li')
      line.textContent = `Request ${index}: HTTP ${item.status}`
      log.append(line)
    }, now)
    summary.textContent = `Requests sent: ${result.sent} (maximum ${MAX_REQUESTS})` +
      (result.stoppedByDeadline ? '; stopped by the minute-boundary safety deadline' : '')
    busy = false
    if (!result.limited) {
      run.disabled = false
      return
    }
    const header = result.limited.retryAfterSeconds
    const label = `Retry-After: ${header ?? 'missing (assuming 60)'} s`
    first429.textContent = `First 429 at request ${result.sent}: code ${result.limited.code ?? 'unknown'}`
    let remaining = header ?? DEFAULT_RETRY_AFTER_SECONDS
    retryAfter.textContent = `${label}; recovery available in ${remaining} s`
    const handle = timers.setInterval(() => {
      remaining -= 1
      if (remaining > 0) {
        retryAfter.textContent = `${label}; recovery available in ${remaining} s`
        return
      }
      timers.clearInterval(handle)
      retryAfter.textContent = `${label}; elapsed`
      recover.disabled = false
    }, 1000)
  })

  recover.addEventListener('click', async () => {
    if (busy || recover.disabled) return
    busy = true
    recover.disabled = true
    const result = await sendRecoveryRequest(fetchImpl)
    recovery.textContent = `Recovery request: HTTP ${result.status}; returned 200: ${result.status === 200 ? 'yes' : 'no'}`
    busy = false
    run.disabled = false
  })
}
