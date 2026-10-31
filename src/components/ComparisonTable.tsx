import { formatMm, getDistance, getEffectiveTopTube } from '../geometry'
import type { DerivedBike } from '../types'

type ComparisonTableProps = {
  bikes: DerivedBike[]
}

export default function ComparisonTable({ bikes }: ComparisonTableProps) {
  const visibleBikes = bikes.filter((bike) => bike.input.visible)

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
            </tr>
          </thead>
          <tbody>
            {visibleBikes.map((bike) => {
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
                    </span>
                  </td>
                  <td>{formatMm(effectiveTopTube)}</td>
                  <td>{formatMm(saddleToBarDistance)}</td>
                  <td>{formatMm(saddleToBarDrop)}</td>
                  <td>{formatMm(saddleToBarHorizontal)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
