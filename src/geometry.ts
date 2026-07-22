import type { BikeInput, DerivedBike, Point, RiderSettings } from './types'

const toRadians = (degrees: number) => (degrees * Math.PI) / 180

const polar = (angleDegrees: number, length: number): Point => {
  const angle = toRadians(angleDegrees)
  return {
    x: Math.cos(angle) * length,
    y: Math.sin(angle) * length,
  }
}

export function getEffectiveTopTube(stack: number, reach: number, seatTubeAngle: number): number {
  const angle = toRadians(seatTubeAngle)
  const seatTubeXAtStack = -stack / Math.tan(angle)
  return reach - seatTubeXAtStack
}

export function deriveBike(input: BikeInput, rider: RiderSettings): DerivedBike {
  const bottomBracket = { x: 0, y: 0 }
  const crankEnd = polar(-input.seatTubeAngle, input.crankLength)

  const seatVector = polar(180 - input.seatTubeAngle, rider.saddleHeight)
  const saddle = {
    x: crankEnd.x + seatVector.x - input.saddleSetback,
    y: crankEnd.y + seatVector.y,
  }
  const seatGuideEnd = {
    x: crankEnd.x + seatVector.x,
    y: crankEnd.y + seatVector.y,
  }

  const headTop = { x: input.reach, y: input.stack }
  const spacerOffset = polar(180 - input.headTubeAngle, input.spacersBelowStem)
  const spacerTop = {
    x: headTop.x + spacerOffset.x,
    y: headTop.y + spacerOffset.y,
  }

  const stemAbsoluteAngle = 90 - input.headTubeAngle + input.stemAngle
  const stemOffset = polar(stemAbsoluteAngle, input.stemLength)
  const stemEnd = {
    x: spacerTop.x + stemOffset.x,
    y: spacerTop.y + stemOffset.y,
  }

  return {
    input,
    bottomBracket,
    crankEnd,
    saddle,
    headTop,
    spacerTop,
    stemEnd,
    seatGuideEnd,
  }
}

export function getDelta(point: Point, reference: Point): Point {
  return {
    x: point.x - reference.x,
    y: point.y - reference.y,
  }
}

export function getDistance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

export function formatMm(value: number): string {
  const rounded = Math.round(value * 10) / 10
  return rounded.toFixed(1)
}
