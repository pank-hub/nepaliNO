import {validateCoordinates, type LocationMapBlock, type MapPlace} from '../maps/location.ts'
import {validatePlace} from '../maps/places.ts'

const validKey = (key: unknown): key is string =>
  typeof key === 'string' && /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(key)

export function eligibleMapPlaces(block: LocationMapBlock): MapPlace[] {
  if (!Array.isArray(block.locations)) return []
  const keys = block.locations.map((place) => place?._key)
  return block.locations.filter((place) =>
    validKey(place?._key) && keys.filter((key) => key === place._key).length === 1 &&
    typeof place.label === 'string' &&
    place.precision === 'exact' && place.radiusMeters === undefined &&
    !validateCoordinates(place.coordinates) && !validatePlace(place),
  )
}

export function selectedMapPlace(block: LocationMapBlock): MapPlace | undefined {
  if (block.travelHelpEnabled !== true || !validKey(block._key)) return
  const places = eligibleMapPlaces(block)
  if (places.length === 1) return places[0]
  return places.find((place) => place._key === block.travelHelpPlaceKey)
}

export function mapTravelValidation(block: LocationMapBlock): string | undefined {
  if (block.travelHelpEnabled !== true) return
  const places = eligibleMapPlaces(block)
  if (!places.length) return 'Add an exact location with valid coordinates and no radius to offer travel assistance.'
  if (places.length > 1 && !places.some((place) => place._key === block.travelHelpPlaceKey)) {
    return 'Select one of the eligible exact locations for travel assistance.'
  }
}
