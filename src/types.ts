export type BikeInput = {
  id: string
  name: string
  color: string
  visible: boolean
  locked: boolean
  stack: number
  reach: number
  seatTubeAngle: number
  headTubeAngle: number
  crankLength: number
  saddleSetback: number
  stemLength: number
  stemAngle: number
  spacersBelowStem: number
}

export type RiderSettings = {
  saddleHeight: number
}

export type Point = {
  x: number
  y: number
}

export type DerivedBike = {
  input: BikeInput
  bottomBracket: Point
  crankEnd: Point
  saddle: Point
  headTop: Point
  spacerTop: Point
  stemEnd: Point
  seatGuideEnd: Point
}
