export const INFORMATION_BOX_VARIANTS = ['important', 'attention', 'tip', 'fact'] as const

export type InformationBoxVariant = (typeof INFORMATION_BOX_VARIANTS)[number]

export interface InformationBoxInput {
  _type?: unknown
  _key?: unknown
  variant?: unknown
  title?: unknown
  body?: unknown
}

export interface NormalizedInformationBox {
  variant: InformationBoxVariant
  title?: string
  // Sanitized Portable Text blocks; never empty.
  body: Record<string, unknown>[]
  idSuffix: string
}

type Block = Record<string, unknown>

const isRecord = (value: unknown): value is Block => typeof value === 'object' && value !== null

const text = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined

export const isSafeLinkHref = (value: unknown): value is string => {
  if (typeof value !== 'string') return false
  const href = value.trim()
  if (!href || /[\u0000-\u001f\u007f\s]/.test(href)) return false
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(href)
  if (scheme) return ['http', 'https'].includes(scheme[1].toLowerCase())
  // Protocol-relative URLs would leave the site silently.
  return !href.startsWith('//') && !href.includes('\\')
}

export const normalizeVariant = (value: unknown): InformationBoxVariant =>
  INFORMATION_BOX_VARIANTS.includes(value as InformationBoxVariant)
    ? (value as InformationBoxVariant)
    : 'fact'

const sanitizeBlock = (block: unknown): Block | undefined => {
  if (!isRecord(block) || block._type !== 'block' || !Array.isArray(block.children)) return undefined

  const markDefs = Array.isArray(block.markDefs) ? block.markDefs.filter(isRecord) : []
  const safeMarkDefs = markDefs.filter(
    (definition) => definition._type !== 'link' || isSafeLinkHref(definition.href),
  )
  const unsafeKeys = new Set(
    markDefs.filter((definition) => !safeMarkDefs.includes(definition)).map((d) => d._key),
  )

  const children = block.children.filter(isRecord).map((child): Block => ({
    ...child,
    marks: Array.isArray(child.marks)
      ? child.marks.filter((mark) => !unsafeKeys.has(mark))
      : [],
  }))
  const hasText = children.some((child) => text(child.text))
  if (!hasText) return undefined

  // Boxes allow paragraphs and lists only; any other style is flattened.
  return {...block, style: 'normal', children, markDefs: safeMarkDefs}
}

export const createInformationBoxIdSuffix = (input: unknown, index = 0): string => {
  const key = isRecord(input) && typeof input._key === 'string' ? input._key : ''
  return key.replace(/[^a-zA-Z0-9_-]/g, '') || `i${index}`
}

export const normalizeInformationBox = (
  input: unknown,
  index = 0,
): NormalizedInformationBox | undefined => {
  const source: InformationBoxInput = isRecord(input) ? input : {}
  const body = Array.isArray(source.body)
    ? source.body.flatMap((block) => {
        const safe = sanitizeBlock(block)
        return safe ? [safe] : []
      })
    : []
  if (!body.length) return undefined

  return {
    variant: normalizeVariant(source.variant),
    title: text(source.title),
    body,
    idSuffix: createInformationBoxIdSuffix(input, index),
  }
}
