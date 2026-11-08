import type {MapCoordinates} from '../maps/location.ts'
import type {DocumentDestinationType, MapDestinationType} from './destinationRegistry.ts'

export type TravelCoordinates = Pick<MapCoordinates, 'lat' | 'lng'>
export type TransportMode = 'air' | 'bicycle' | 'bus' | 'cableway' | 'water' |
  'funicular' | 'lift' | 'rail' | 'snowAndIce' | 'metro' | 'taxi' | 'tram' |
  'trolleybus' | 'monorail' | 'coach' | 'foot' | 'car' | 'scooter' | 'carpool'

export interface OriginSuggestion {
  label: string
  coordinates: TravelCoordinates
  id?: string
  locality?: string
  category?: string
}

export interface JourneyRequest {
  origin: TravelCoordinates
  destination: DestinationSelector
  dateTime: string
  mode: 'departAfter' | 'arriveBy'
}

export type DestinationSelector =
  | {type: DocumentDestinationType; id: string}
  | {type: MapDestinationType; id: string; mapKey: string; placeKey: string}

export interface ResolvedJourneyRequest extends Omit<JourneyRequest, 'destination'> {
  destination: TravelCoordinates
}

export interface JourneyLeg {
  startTime: string
  endTime: string
  mode: TransportMode
  durationSeconds: number
  fromName?: string
  toName?: string
  isPublicTransport: boolean
  realtime: boolean
  lineName?: string
}

export interface Journey {
  startTime: string
  endTime: string
  durationSeconds: number
  transfers: number
  walkingDurationSeconds?: number
  legs: JourneyLeg[]
}
