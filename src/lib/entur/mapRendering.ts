import type {LocationMapBlock} from '../maps/location.ts'
import type {DestinationSelector} from './types.ts'
import {selectedMapPlace} from './mapDestination.ts'
import {parseDestinationSelector} from './validation.ts'
import type {MapDestinationType} from './destinationRegistry.ts'

export function withMapTravelDestination<T extends {_type: string}>(
  body: T[],
  type: MapDestinationType,
  id: string,
  preview: boolean,
): T[] {
  return body.map((node) => {
    if (node._type !== 'locationMap') return node
    const block = node as T & LocationMapBlock
    const place = selectedMapPlace(block)
    const travelDestination: DestinationSelector | undefined = place && !preview
      ? parseDestinationSelector({type, id, mapKey: block._key, placeKey: place._key})
      : undefined
    return {...node, travelDestination, travelPreview: preview && !!place}
  })
}
