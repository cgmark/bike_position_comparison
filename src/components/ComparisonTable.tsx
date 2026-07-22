import { formatMm, getDelta, getDistance, getEffectiveTopTube } from '../geometry'
import type { DerivedBike } from '../types'

type ComparisonTableProps = {
  bikes: DerivedBike[]
  referenceId: string
}

export default function ComparisonTable({ bikes, referenceId }: ComparisonTableProps) {
  const visibleBikes = bikes.filter((bike) => bike.input.visible)
  const reference = visibleBikes.find((bike) => bike.input.id === referenceId) ?? visibleBikes[0]

  return (
    <section className="panel table-panel">
      <div className="panel-header">
        <div>
          <h2 className="section-title-with-help">
            Position Comparison
            <button
              type="button"
              className="help-button"
              aria-label="Position comparison help"
              data-tooltip="All values are in mm."
            >
              ?
            </button>
          </h2>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Bike</th>
              <th>Effective Top Tube</th>
              <th>Saddle-Bar Distance</th>
              <th>Saddle-Bar Drop</th>
              <th>Saddle-Bar Horizontal</th>
              <th>Delta Saddle X</th>
              <th>Delta Saddle Y</th>
              <th>Delta Bar X</th>
              <th>Delta Bar Y</th>
            </tr>
          </thead>
          <tbody>
            {visibleBikes.map((bike) => {
              const saddleDelta = reference ? getDelta(bike.saddle, reference.saddle) : { x: 0, y: 0 }
              const stemDelta = reference ? getDelta(bike.stemEnd, reference.stemEnd) : { x: 0, y: 0 }
              const effectiveTopTube = getEffectiveTopTube(
                bike.input.stack,
                bike.input.reach,
                bike.input.seatTubeAngle,
              )
              const saddleToBarDistance = getDistance(bike.saddle, bike.stemEnd)
              const saddleToBarDrop = bike.saddle.y - bike.stemEnd.y
              const saddleToBarHorizontal = bike.stemEnd.x - bike.saddle.x

              return (
                <tr key={bike.input.id}>
                  <td>
                    <span className="table-bike-name">
                      <span className="legend-swatch" style={{ backgroundColor: bike.input.color }} />
                      {bike.input.name}
                      {reference?.input.id === bike.input.id ? ' (ref)' : ''}
                    </span>
                  </td>
                  <td>{formatMm(effectiveTopTube)}</td>
                  <td>{formatMm(saddleToBarDistance)}</td>
                  <td>{formatMm(saddleToBarDrop)}</td>
                  <td>{formatMm(saddleToBarHorizontal)}</td>
                  <td>{formatMm(saddleDelta.x)}</td>
                  <td>{formatMm(saddleDelta.y)}</td>
                  <td>{formatMm(stemDelta.x)}</td>
                  <td>{formatMm(stemDelta.y)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
