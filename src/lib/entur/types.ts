import type {MapCoordinates} from '../maps/location.ts'

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
  destination: {type: 'communityEvent' | 'directoryListing'; id: string}
  dateTime: string
  mode: 'departAfter' | 'arriveBy'
}

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
