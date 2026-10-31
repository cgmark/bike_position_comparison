import { useEffect, useRef, useState } from 'react'

type ValidatedNumberInputProps = {
  value: number
  onCommit: (value: number) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  ariaLabel?: string
}

function isValidNumber(value: number, min?: number, max?: number) {
  return Number.isFinite(value) && (min === undefined || value >= min) && (max === undefined || value <= max)
}

export default function ValidatedNumberInput({
  value,
  onCommit,
  min,
  max,
  step = 1,
  disabled = false,
  ariaLabel,
}: ValidatedNumberInputProps) {
  const [draft, setDraft] = useState(String(value))
  const [wasRejected, setWasRejected] = useState(false)
  const isAdjusting = useRef(false)

  useEffect(() => {
    setDraft(String(value))
    setWasRejected(false)
  }, [value])

  const restoreValue = () => {
    setDraft(String(value))
    setWasRejected(true)
  }

  const commit = (nextDraft: string) => {
    const nextValue = Number(nextDraft)
    if (!nextDraft.trim() || !isValidNumber(nextValue, min, max)) {
      restoreValue()
      return
    }

    setWasRejected(false)
    onCommit(nextValue)
  }

  return (
    <input
      type="number"
      min={min}
      max={max}
      step={step}
      value={draft}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-invalid={wasRejected || undefined}
      onWheel={(event) => event.currentTarget.blur()}
      onChange={(event) => {
        const nextDraft = event.target.value
        setDraft(nextDraft)
        setWasRejected(false)
        if (isAdjusting.current) {
          commit(nextDraft)
        }
      }}
      onKeyDown={(event) => {
        if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
          isAdjusting.current = true
        } else if (event.key === 'Enter') {
          event.preventDefault()
          commit(draft)
        }
      }}
      onKeyUp={(event) => {
        if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
          isAdjusting.current = false
        }
      }}
      onPointerDown={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect()
        if (event.clientX >= bounds.right - 24) {
          isAdjusting.current = true
        }
      }}
      onPointerUp={() => {
        isAdjusting.current = false
      }}
      onBlur={() => {
        isAdjusting.current = false
        commit(draft)
      }}
    />
  )
}
