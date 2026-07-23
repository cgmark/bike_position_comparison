import type { BikeInput } from '../types'

type BikeFormProps = {
  bike: BikeInput
  onChange: (id: string, key: keyof BikeInput, value: string | number | boolean) => void
  onRemove: (id: string) => void
  onDuplicate: (id: string) => void
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
  onSetReference: (id: string) => void
  isReference: boolean
  canRemove: boolean
  canMoveUp: boolean
  canMoveDown: boolean
}

type NumberField = {
  key: keyof BikeInput
  label: string
  step?: number
}

const preventWheelValueChange = (event: React.WheelEvent<HTMLInputElement>) => {
  event.currentTarget.blur()
}

const numberFields: NumberField[] = [
  { key: 'stack', label: 'Stack' },
  { key: 'reach', label: 'Reach' },
  { key: 'seatTubeAngle', label: 'STA', step: 0.1 },
  { key: 'headTubeAngle', label: 'HTA', step: 0.1 },
  { key: 'crankLength', label: 'Crank' },
  { key: 'saddleSetback', label: 'Setback' },
  { key: 'stemLength', label: 'Stem' },
  { key: 'stemAngle', label: 'Stem Angle', step: 0.1 },
  { key: 'spacersBelowStem', label: 'Spacers' },
]

export default function BikeForm({
  bike,
  onChange,
  onRemove,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onSetReference,
  isReference,
  canRemove,
  canMoveUp,
  canMoveDown,
}: BikeFormProps) {
  const handleRemove = () => {
    if (!canRemove) {
      return
    }

    const confirmed = window.confirm(`Remove ${bike.name}?`)
    if (confirmed) {
      onRemove(bike.id)
    }
  }

  return (
    <section className="bike-card">
      <div className="bike-card-header">
        <div className="bike-card-actions">
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
          <label
            className="icon-button icon-color-picker"
            data-tooltip="Bike color"
            style={{ backgroundColor: bike.color, color: '#020617' }}
          >
            <input
              type="color"
              value={bike.color}
              onChange={(event) => onChange(bike.id, 'color', event.target.value)}
              aria-label="Bike color"
            />
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path
                d="M9.8 2.2a1.9 1.9 0 0 1 2.7 0l1.3 1.3a1.9 1.9 0 0 1 0 2.7l-1.1 1.1-1.5-1.5-.9.9 1.5 1.5-4.9 4.9H5.1V11l4.7-4.7-1.5-1.5.9-.9 1.5 1.5 1.1-1.1a.6.6 0 0 0 0-.8l-1.3-1.3a.6.6 0 0 0-.8 0L8.6 3.3l-.9-.9 2.1-2.1Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </svg>
          </label>
          <button
            type="button"
            className={isReference ? 'icon-button icon-button-active' : 'icon-button'}
            onClick={() => onSetReference(bike.id)}
            aria-label={isReference ? 'Reference bike' : 'Set as reference bike'}
            data-tooltip={isReference ? 'Reference bike' : 'Set as reference bike'}
          >
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <circle cx="8" cy="8" r="5" fill="none" stroke="currentColor" strokeWidth="1.4" />
              <circle cx="8" cy="8" r="2.1" fill="none" stroke="currentColor" strokeWidth="1.4" />
              <path d="M8 1.6V4M8 12V14.4M1.6 8H4M12 8H14.4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
          <button
            type="button"
            className="icon-button"
            onClick={() => onMoveUp(bike.id)}
            disabled={!canMoveUp}
            aria-label="Move bike up"
            data-tooltip="Move bike up"
          >
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M4 10L8 6L12 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            className="icon-button"
            onClick={() => onMoveDown(bike.id)}
            disabled={!canMoveDown}
            aria-label="Move bike down"
            data-tooltip="Move bike down"
          >
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M4 6L8 10L12 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            className="icon-button"
            onClick={() => onDuplicate(bike.id)}
            aria-label="Duplicate bike"
            data-tooltip="Duplicate bike"
          >
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <rect x="5" y="3" width="8" height="10" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
              <rect x="2" y="6" width="8" height="8" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </button>
          <button
            type="button"
            className="icon-button icon-button-delete icon-button-tooltip-end"
            onClick={handleRemove}
            disabled={!canRemove}
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
        </div>
        <input
          className="bike-name-input"
          value={bike.name}
          disabled={bike.locked}
          onChange={(event) => onChange(bike.id, 'name', event.target.value)}
          aria-label="Bike name"
        />
      </div>

      <div className="field-grid">
        {numberFields.map((field) => (
          <label key={field.key} className="field">
            <span>{field.label}</span>
            <input
              type="number"
              step={field.step ?? 1}
              value={bike[field.key] as number}
              disabled={bike.locked}
              onWheel={preventWheelValueChange}
              onChange={(event) => onChange(bike.id, field.key, Number(event.target.value))}
            />
          </label>
        ))}
      </div>
    </section>
  )
}
