import { formatMm, getDistance } from '../geometry'
import { useState } from 'react'
import type { BikeInput, DerivedBike } from '../types'
import { bikeNumberLimits } from '../validation'
import ValidatedNumberInput from './ValidatedNumberInput'

type BikeTableProps = {
  bikes: DerivedBike[]
  onChange: (id: string, key: keyof BikeInput, value: string | number | boolean) => void
  onRemove: (id: string) => void
  onDuplicate: (id: string) => void
  onMove: (id: string, targetId: string) => void
}

type NumberField = {
  key: keyof BikeInput
  label: string
  step?: number
  min?: number
  max?: number
}

const numberFields: NumberField[] = [
  { key: 'stack', label: 'Stack', ...bikeNumberLimits.stack },
  { key: 'reach', label: 'Reach', ...bikeNumberLimits.reach },
  { key: 'seatTubeAngle', label: 'STA', step: 0.1, ...bikeNumberLimits.seatTubeAngle },
  { key: 'headTubeAngle', label: 'HTA', step: 0.1, ...bikeNumberLimits.headTubeAngle },
  { key: 'crankLength', label: 'Crank', ...bikeNumberLimits.crankLength },
  { key: 'saddleSetback', label: 'Setback', ...bikeNumberLimits.saddleSetback },
  { key: 'stemLength', label: 'Length', ...bikeNumberLimits.stemLength },
  { key: 'stemAngle', label: 'Angle', step: 0.1, ...bikeNumberLimits.stemAngle },
  { key: 'spacersBelowStem', label: 'Spacer', ...bikeNumberLimits.spacersBelowStem },
]

export default function BikeTable({ bikes, onChange, onRemove, onDuplicate, onMove }: BikeTableProps) {
  const [draggedBikeId, setDraggedBikeId] = useState<string | null>(null)
  const [dropTargetId, setDropTargetId] = useState<string | null>(null)

  const handleRemove = (bike: BikeInput) => {
    if (bikes.length > 1 && window.confirm(`Remove ${bike.name}?`)) {
      onRemove(bike.id)
    }
  }

  return (
    <section className="panel bike-editor-panel">
      <div className="panel-header">
        <h2 className="sidebar-actions-title">Bike Settings &amp; Position Comparison</h2>
      </div>
      <div className="bike-editor-wrap">
        <table className="bike-editor-table">
          <thead>
            <tr>
              <th className="bike-editor-actions-column" rowSpan={2} />
              <th colSpan={numberFields.length - 2} />
              <th colSpan={3}>Stem</th>
              <th colSpan={3}>Saddle-to-Bar</th>
            </tr>
            <tr>
              <th className="bike-editor-name-column">Bike</th>
              {numberFields.map((field) => (
                <th key={field.key}>{field.label}</th>
              ))}
              <th>Distance</th>
              <th>Drop</th>
              <th>Horizontal</th>
            </tr>
          </thead>
          <tbody>
            {bikes.map((derivedBike) => {
              const bike = derivedBike.input
              const saddleToBarDistance = getDistance(derivedBike.saddle, derivedBike.stemEnd)
              const saddleToBarDrop = derivedBike.saddle.y - derivedBike.stemEnd.y
              const saddleToBarHorizontal = derivedBike.stemEnd.x - derivedBike.saddle.x

              return (
                <tr
                  key={bike.id}
                  className={`${draggedBikeId === bike.id ? 'bike-row-dragging ' : ''}${dropTargetId === bike.id ? 'bike-row-drop-target' : ''}`}
                  onDragOver={(event) => {
                    event.preventDefault()
                    if (draggedBikeId && draggedBikeId !== bike.id) {
                      setDropTargetId(bike.id)
                    }
                  }}
                  onDrop={(event) => {
                    event.preventDefault()
                    if (draggedBikeId) {
                      onMove(draggedBikeId, bike.id)
                    }
                    setDraggedBikeId(null)
                    setDropTargetId(null)
                  }}
                >
                <td className="bike-editor-actions-column">
                  <div className="bike-table-controls">
                    <button
                      type="button"
                      className="icon-button bike-drag-handle"
                      draggable
                      aria-label="Drag to reorder bike"
                      data-tooltip="Drag to reorder"
                      onDragStart={(event) => {
                        event.dataTransfer.effectAllowed = 'move'
                        event.dataTransfer.setData('text/plain', bike.id)
                        setDraggedBikeId(bike.id)
                      }}
                      onDragEnd={() => {
                        setDraggedBikeId(null)
                        setDropTargetId(null)
                      }}
                    >
                      <svg viewBox="0 0 16 16" aria-hidden="true">
                        <circle cx="5" cy="4" r="1" fill="currentColor" />
                        <circle cx="11" cy="4" r="1" fill="currentColor" />
                        <circle cx="5" cy="8" r="1" fill="currentColor" />
                        <circle cx="11" cy="8" r="1" fill="currentColor" />
                        <circle cx="5" cy="12" r="1" fill="currentColor" />
                        <circle cx="11" cy="12" r="1" fill="currentColor" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className={bike.locked ? 'icon-button icon-button-active' : 'icon-button'}
                      onClick={() => onChange(bike.id, 'locked', !bike.locked)}
                      aria-label={bike.locked ? 'Unlock bike settings' : 'Lock bike settings'}
                      data-tooltip={bike.locked ? 'Unlock bike settings' : 'Lock bike settings'}
                    >
                      <svg viewBox="0 0 16 16" aria-hidden="true">
                        {bike.locked ? (
                          <>
                            <rect x="3.5" y="7" width="9" height="6.5" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
                            <path d="M5.5 7V5.5A2.5 2.5 0 0 1 8 3a2.5 2.5 0 0 1 2.5 2.5V7" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                          </>
                        ) : (
                          <>
                            <rect x="3.5" y="7" width="9" height="6.5" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
                            <path d="M5.5 7V5.5A2.5 2.5 0 0 1 8 3a2.5 2.5 0 0 1 2.5 2.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                            <path d="M10.5 5.8L12.6 4.3" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                          </>
                        )}
                      </svg>
                    </button>
                    <button
                      type="button"
                      className={bike.visible ? 'icon-button icon-button-active' : 'icon-button'}
                      onClick={() => onChange(bike.id, 'visible', !bike.visible)}
                      aria-label={bike.visible ? 'Hide bike' : 'Show bike'}
                      data-tooltip={bike.visible ? 'Hide bike' : 'Show bike'}
                    >
                      <svg viewBox="0 0 16 16" aria-hidden="true">
                        {bike.visible ? (
                          <>
                            <path d="M1.8 8C3.2 5.4 5.3 4 8 4s4.8 1.4 6.2 4c-1.4 2.6-3.5 4-6.2 4S3.2 10.6 1.8 8Z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                            <circle cx="8" cy="8" r="1.9" fill="none" stroke="currentColor" strokeWidth="1.4" />
                          </>
                        ) : (
                          <>
                            <path d="M2.2 2.2L13.8 13.8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                            <path d="M4.1 4.1C5.2 3.4 6.5 3 8 3c2.7 0 4.8 1.4 6.2 4-.6 1.1-1.4 2-2.2 2.6" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M11 11.2C10.1 11.7 9.1 12 8 12c-2.7 0-4.8-1.4-6.2-4 .5-.9 1.1-1.7 1.8-2.3" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                          </>
                        )}
                      </svg>
                    </button>
                    <button type="button" className="icon-button" onClick={() => onDuplicate(bike.id)} aria-label="Duplicate bike" data-tooltip="Duplicate bike">
                      <svg viewBox="0 0 16 16" aria-hidden="true">
                        <rect x="5" y="3" width="8" height="10" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
                        <rect x="2" y="6" width="8" height="8" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="icon-button icon-button-delete"
                      onClick={() => handleRemove(bike)}
                      disabled={bikes.length === 1}
                      aria-label="Remove bike"
                      data-tooltip="Remove bike"
                    >
                      <svg viewBox="0 0 16 16" aria-hidden="true">
                        <path d="M3.5 4.5H12.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                        <path d="M6 2.8H10" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                        <path d="M5 4.5V11.8C5 12.5 5.5 13 6.2 13H9.8C10.5 13 11 12.5 11 11.8V4.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                        <path d="M7 6.2V10.8M9 6.2V10.8" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                      </svg>
                    </button>
                    <label className="bike-color-picker" style={{ backgroundColor: bike.color }}>
                      <input
                        type="color"
                        value={bike.color}
                        onChange={(event) => onChange(bike.id, 'color', event.target.value)}
                        aria-label="Bike color"
                      />
                    </label>
                  </div>
                </td>
                <td className="bike-editor-name-column">
                  <input
                    className="bike-name-input"
                    value={bike.name}
                    style={{ color: bike.color }}
                    disabled={bike.locked}
                    onChange={(event) => onChange(bike.id, 'name', event.target.value)}
                    aria-label="Bike name"
                  />
                </td>
                {numberFields.map((field) => (
                  <td key={field.key}>
                    <ValidatedNumberInput
                      value={bike[field.key] as number}
                      disabled={bike.locked}
                      step={field.step}
                      min={field.min}
                      max={field.max}
                      ariaLabel={`${bike.name} ${field.label}`}
                      onCommit={(value) => onChange(bike.id, field.key, value)}
                    />
                  </td>
                ))}
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
