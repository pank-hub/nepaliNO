// Register selector shapes explicitly; server adapters independently enforce publication.
export const destinationKinds = {
  communityEvent: 'document',
  directoryListing: 'document',
  newsArticle: 'map',
  publicInformationGuide: 'map',
} as const

export type DestinationType = keyof typeof destinationKinds
export type DocumentDestinationType = {
  [K in DestinationType]: typeof destinationKinds[K] extends 'document' ? K : never
}[DestinationType]
export type MapDestinationType = Exclude<DestinationType, DocumentDestinationType>

export function isDestinationType(value: unknown): value is DestinationType {
  return typeof value === 'string' && Object.hasOwn(destinationKinds, value)
}

export function isDocumentDestinationType(type: DestinationType): type is DocumentDestinationType {
  return destinationKinds[type] === 'document'
}
