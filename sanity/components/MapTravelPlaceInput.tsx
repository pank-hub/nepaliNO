import {Select} from '@sanity/ui'
import {set, unset, useFormValue, type StringInputProps} from 'sanity'
import {eligibleMapPlaces} from '../../src/lib/entur/mapDestination'
import type {LocationMapBlock} from '../../src/lib/maps/location'

export function MapTravelPlaceInput(props: StringInputProps) {
  const parent = useFormValue(props.path.slice(0, -1)) as LocationMapBlock | undefined
  const places = eligibleMapPlaces(parent ?? {})
  return (
    <Select
      value={props.value ?? ''}
      disabled={props.readOnly}
      onChange={(event) => props.onChange(event.currentTarget.value ? set(event.currentTarget.value) : unset())}
      aria-label="Travel assistance destination"
    >
      <option value="">Select a destination</option>
      {places.map((place) => <option key={place._key} value={place._key}>{place.label || place._key}</option>)}
    </Select>
  )
}
