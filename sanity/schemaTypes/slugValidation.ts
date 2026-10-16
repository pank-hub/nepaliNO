export const SAFE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

// Returns true when valid, otherwise an editor-facing message. Never rewrites the value.
export const validateSafeSlug = (current: unknown): true | string => {
  if (typeof current !== 'string' || current === '') return true

  if (current !== current.trim()) {
    return 'The slug has a leading or trailing space. Remove it.'
  }
  if (/\s/.test(current)) {
    return 'The slug cannot contain spaces. Use hyphens between words.'
  }
  if (/[A-Z]/.test(current)) {
    return 'The slug must be lowercase.'
  }
  if (/^-|-$/.test(current)) {
    return 'The slug cannot start or end with a hyphen.'
  }
  if (/--/.test(current)) {
    return 'The slug cannot contain consecutive hyphens.'
  }
  if (!SAFE_SLUG_PATTERN.test(current)) {
    return 'Use only lowercase Latin letters (a-z), digits and single hyphens. Devanagari and other characters are not allowed in the URL slug.'
  }

  return true
}
