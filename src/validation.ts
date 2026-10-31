import type { BikeInput, RiderSettings } from './types'

type NumberLimits = {
  min?: number
  max?: number
}

export const bikeNumberLimits = {
  stack: { min: 1 },
  reach: { min: 1 },
  seatTubeAngle: { min: 1, max: 179 },
  headTubeAngle: { min: 1, max: 179 },
  crankLength: { min: 1 },
  saddleSetback: {},
  stemLength: { min: 0 },
  stemAngle: { min: -90, max: 90 },
  spacersBelowStem: { min: 0 },
} satisfies Record<
  Exclude<keyof BikeInput, 'id' | 'name' | 'color' | 'visible' | 'locked'>,
  NumberLimits
>

export const saddleHeightLimits: NumberLimits = { min: 1 }

export type PersistedState = {
  bikes: BikeInput[]
  rider: RiderSettings
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isValidNumber(value: unknown, { min, max }: NumberLimits): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    (min === undefined || value >= min) &&
    (max === undefined || value <= max)
  )
}

export function validateBike(value: unknown): BikeInput | null {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    !value.id.trim() ||
    typeof value.name !== 'string' ||
    !value.name.trim() ||
    typeof value.color !== 'string' ||
    !/^#[0-9a-f]{6}$/i.test(value.color) ||
    typeof value.visible !== 'boolean' ||
    typeof value.locked !== 'boolean'
  ) {
    return null
  }

  for (const [field, limits] of Object.entries(bikeNumberLimits)) {
    if (!isValidNumber(value[field], limits)) {
      return null
    }
  }

  return value as BikeInput
}

export function validatePersistedState(value: unknown): PersistedState | null {
  if (!isRecord(value) || !Array.isArray(value.bikes) || value.bikes.length === 0 || !isRecord(value.rider)) {
    return null
  }

  const bikes = value.bikes.map(validateBike)
  if (bikes.some((bike) => bike === null)) {
    return null
  }

  const validBikes = bikes as BikeInput[]
  if (new Set(validBikes.map((bike) => bike.id)).size !== validBikes.length) {
    return null
  }

  if (!isValidNumber(value.rider.saddleHeight, saddleHeightLimits)) {
    return null
  }

  return {
    bikes: validBikes,
    rider: { saddleHeight: value.rider.saddleHeight },
  }
}
