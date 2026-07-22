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
        <input
          className="bike-name-input"
          value={bike.name}
          disabled={bike.locked}
          onChange={(event) => onChange(bike.id, 'name', event.target.value)}
          aria-label="Bike name"
        />
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
            className="icon-button icon-button-delete"
            onClick={handleRemove}
            disabled={!canRemove}
            aria-label="Remove bike"
            data-tooltip="Remove bike"
          >
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M4 4L12 12M12 4L4 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      <div className="inline-controls">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={bike.visible}
            onChange={(event) => onChange(bike.id, 'visible', event.target.checked)}
          />
          Visible
        </label>

        <label className="field compact-field">
          <span>Color</span>
          <input
            type="color"
            value={bike.color}
            onChange={(event) => onChange(bike.id, 'color', event.target.value)}
          />
        </label>

        <button
          type="button"
          className={isReference ? 'solid-button' : 'ghost-button'}
          onClick={() => onSetReference(bike.id)}
        >
          {isReference ? 'Reference Bike' : 'Set Reference'}
        </button>
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
