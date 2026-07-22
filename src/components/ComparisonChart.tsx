import type { DerivedBike, Point } from '../types'

type ComparisonChartProps = {
  bikes: DerivedBike[]
}

type Bounds = {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

const WIDTH = 900
const HEIGHT = 460
const PADDING = 36

function collectPoints(bike: DerivedBike): Point[] {
  return [bike.bottomBracket, bike.crankEnd, bike.saddle, bike.headTop, bike.spacerTop, bike.stemEnd, bike.seatGuideEnd]
}

function getBounds(bikes: DerivedBike[]): Bounds {
  const points = bikes.flatMap(collectPoints)
  if (points.length === 0) {
    return { minX: -200, maxX: 200, minY: -200, maxY: 200 }
  }

  return points.reduce(
    (bounds, point) => ({
      minX: Math.min(bounds.minX, point.x),
      maxX: Math.max(bounds.maxX, point.x),
      minY: Math.min(bounds.minY, point.y),
      maxY: Math.max(bounds.maxY, point.y),
    }),
    { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity },
  )
}

function makeProjector(bounds: Bounds) {
  const width = Math.max(bounds.maxX - bounds.minX, 1)
  const height = Math.max(bounds.maxY - bounds.minY, 1)
  const scale = Math.min((WIDTH - PADDING * 2) / width, (HEIGHT - PADDING * 2) / height)

  return (point: Point) => ({
    x: PADDING + (point.x - bounds.minX) * scale,
    y: HEIGHT - PADDING - (point.y - bounds.minY) * scale,
  })
}

function marker(point: Point, color: string) {
  return (
    <g>
      <circle cx={point.x} cy={point.y} r="5" fill={color} />
    </g>
  )
}

export default function ComparisonChart({ bikes }: ComparisonChartProps) {
  const visibleBikes = bikes.filter((bike) => bike.input.visible)
  const bounds = getBounds(visibleBikes)
  const project = makeProjector(bounds)
  const projectedOrigin = project({ x: 0, y: 0 })

  return (
    <section className="panel chart-panel">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="chart" role="img" aria-label="Bike geometry comparison chart">
        <rect x="0" y="0" width={WIDTH} height={HEIGHT} fill="#0b1220" rx="24" />
        <line x1="0" y1={projectedOrigin.y} x2={WIDTH} y2={projectedOrigin.y} className="axis-line" />
        <line x1={projectedOrigin.x} y1="0" x2={projectedOrigin.x} y2={HEIGHT} className="axis-line" />

        {visibleBikes.map((bike) => {
          const bb = project(bike.bottomBracket)
          const crankEnd = project(bike.crankEnd)
          const saddle = project(bike.saddle)
          const headTop = project(bike.headTop)
          const spacerTop = project(bike.spacerTop)
          const stemEnd = project(bike.stemEnd)
          const seatGuideEnd = project(bike.seatGuideEnd)

          return (
            <g key={bike.input.id}>
              <line x1={bb.x} y1={bb.y} x2={seatGuideEnd.x} y2={seatGuideEnd.y} stroke={bike.input.color} strokeWidth="2" strokeDasharray="6 6" opacity="0.55" />
              <line x1={bb.x} y1={bb.y} x2={crankEnd.x} y2={crankEnd.y} stroke={bike.input.color} strokeWidth="4" strokeLinecap="round" />
              <line x1={headTop.x} y1={headTop.y} x2={spacerTop.x} y2={spacerTop.y} stroke={bike.input.color} strokeWidth="4" strokeLinecap="round" />
              <line x1={spacerTop.x} y1={spacerTop.y} x2={stemEnd.x} y2={stemEnd.y} stroke={bike.input.color} strokeWidth="4" strokeLinecap="round" />
              <line x1={bb.x} y1={bb.y} x2={headTop.x} y2={headTop.y} stroke={bike.input.color} strokeWidth="2" opacity="0.3" />
              <line x1={saddle.x} y1={saddle.y} x2={stemEnd.x} y2={stemEnd.y} stroke={bike.input.color} strokeWidth="2" strokeDasharray="8 6" opacity="0.75" />

              {marker(saddle, bike.input.color)}
              {marker(stemEnd, bike.input.color)}
            </g>
          )
        })}

        <circle cx={projectedOrigin.x} cy={projectedOrigin.y} r="7" fill="#f8fafc" />
        <text x={projectedOrigin.x + 10} y={projectedOrigin.y - 10} fill="#f8fafc" fontSize="12" fontWeight="700">
          Bottom-bracket
        </text>
      </svg>

      <div className="legend">
        {visibleBikes.map((bike) => (
          <div key={bike.input.id} className="legend-item">
            <span className="legend-swatch" style={{ backgroundColor: bike.input.color }} />
            <span>{bike.input.name}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
