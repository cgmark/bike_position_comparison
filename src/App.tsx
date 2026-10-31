import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'
import { useEffect, useMemo, useRef, useState } from 'react'
import BikeForm from './components/BikeForm'
import ComparisonChart from './components/ComparisonChart'
import ComparisonTable from './components/ComparisonTable'
import ValidatedNumberInput from './components/ValidatedNumberInput'
import { deriveBike } from './geometry'
import type { BikeInput, RiderSettings } from './types'
import {
  bikeNumberLimits,
  saddleHeightLimits,
  validateBike,
  validatePersistedState,
  type PersistedState,
} from './validation'

const sampleBikes: BikeInput[] = [
  {
    id: 'bike-a',
    name: 'Road Race',
    color: '#38bdf8',
    visible: true,
    locked: false,
    stack: 565,
    reach: 395,
    seatTubeAngle: 74,
    headTubeAngle: 73,
    crankLength: 172.5,
    saddleSetback: 0,
    stemLength: 110,
    stemAngle: -6,
    spacersBelowStem: 20,
  },
  {
    id: 'bike-b',
    name: 'Endurance',
    color: '#f97316',
    visible: true,
    locked: false,
    stack: 590,
    reach: 382,
    seatTubeAngle: 73.2,
    headTubeAngle: 72.5,
    crankLength: 170,
    saddleSetback: 0,
    stemLength: 100,
    stemAngle: 6,
    spacersBelowStem: 30,
  },
]

const defaultRiderSettings: RiderSettings = {
  saddleHeight: 760,
}

const STORAGE_KEY = 'bike-fit-compare-state'
const SHARE_STATE_KEY = 'state'

type InitialState = {
  persistedState: PersistedState
  consumedShareState: boolean
}

type GeometryGeeksImport = {
  name: string
  stack?: number
  reach?: number
  seatTubeAngle?: number
  headTubeAngle?: number
  crankLength?: number
  stemLength?: number
}

type GeometryGeeksImportDefaults = {
  crankLength: number
  saddleSetback: number
  stemLength: number
  stemAngle: number
  spacersBelowStem: number
}

type GeometryGeeksNumericField = Exclude<keyof GeometryGeeksImport, 'name'>

const geometryGeeksFieldMap: Record<string, GeometryGeeksNumericField> = {
  Reach: 'reach',
  Stack: 'stack',
  'Seat Angle': 'seatTubeAngle',
  'Head Angle': 'headTubeAngle',
  'Crank Length': 'crankLength',
  'Stem Length': 'stemLength',
}

const defaultGeometryGeeksImportDefaults: GeometryGeeksImportDefaults = {
  crankLength: 170,
  saddleSetback: 0,
  stemLength: 100,
  stemAngle: -6,
  spacersBelowStem: 20,
}

function getDefaultPersistedState(): PersistedState {
  return {
    bikes: sampleBikes,
    referenceId: sampleBikes[0].id,
    rider: defaultRiderSettings,
  }
}

function parsePersistedState(raw: string): PersistedState | null {
  try {
    return validatePersistedState(JSON.parse(raw))
  } catch {
    return null
  }
}

function loadShareState(): PersistedState | null {
  if (typeof window === 'undefined') {
    return null
  }

  const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash
  const encodedState = new URLSearchParams(hash).get(SHARE_STATE_KEY)
  if (!encodedState) {
    return null
  }

  const decompressedState = decompressFromEncodedURIComponent(encodedState)
  if (!decompressedState) {
    return null
  }

  return parsePersistedState(decompressedState)
}

function loadPersistedState(): PersistedState | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? parsePersistedState(raw) : null
  } catch {
    return null
  }
}

function loadInitialState(): InitialState {
  const sharedState = loadShareState()
  if (sharedState) {
    return {
      persistedState: sharedState,
      consumedShareState: true,
    }
  }

  return {
    persistedState: loadPersistedState() ?? getDefaultPersistedState(),
    consumedShareState: false,
  }
}

function parseGeometryGeeksValue(rawValue: string): number | undefined {
  const match = rawValue.match(/-?\d+(?:\.\d+)?/)
  if (!match) {
    return undefined
  }

  return Number(match[0])
}

function parseGeometryGeeksImportAtIndex(lines: string[], chooseBaselineIndex: number): GeometryGeeksImport[] | null {
  const importedBikes: GeometryGeeksImport[] = []
  for (let lineIndex = chooseBaselineIndex - 1; lineIndex > 0; lineIndex -= 2) {
    const detail = lines[lineIndex]
    if (!detail.includes(':')) {
      break
    }

    const name = lines[lineIndex - 1]
    importedBikes.push({ name: `${name} ${detail}` })
  }

  importedBikes.reverse()
  if (importedBikes.length === 0) {
    return null
  }

  const removeIndex = lines.findIndex((line, index) => index > chooseBaselineIndex && line === 'Remove')
  const rowLines = lines.slice(chooseBaselineIndex + 1, removeIndex === -1 ? lines.length : removeIndex)

  for (const line of rowLines) {
    if (!line.includes('\t')) {
      continue
    }

    const [rawLabel, ...rawValues] = line.split('\t')
    const field = geometryGeeksFieldMap[rawLabel.trim()]
    if (!field) {
      continue
    }

    for (let bikeIndex = 0; bikeIndex < importedBikes.length; bikeIndex += 1) {
      const parsedValue = parseGeometryGeeksValue(rawValues[bikeIndex] ?? '')
      if (parsedValue === undefined) {
        continue
      }

      importedBikes[bikeIndex][field] = parsedValue
    }
  }

  const hasSupportedFields = importedBikes.some(
    (bike) =>
      bike.stack !== undefined ||
      bike.reach !== undefined ||
      bike.seatTubeAngle !== undefined ||
      bike.headTubeAngle !== undefined ||
      bike.crankLength !== undefined ||
      bike.stemLength !== undefined,
  )

  return hasSupportedFields ? importedBikes : null
}

function parseGeometryGeeksImport(text: string): GeometryGeeksImport[] | null {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  const chooseBaselineIndexes = lines.reduce<number[]>((indexes, line, index) => {
    if (line === 'Choose Baseline') {
      indexes.push(index)
    }

    return indexes
  }, [])

  for (let index = chooseBaselineIndexes.length - 1; index >= 0; index -= 1) {
    const parsedImport = parseGeometryGeeksImportAtIndex(lines, chooseBaselineIndexes[index])
    if (parsedImport) {
      return parsedImport
    }
  }

  return null
}

function makeNewBike(index: number): BikeInput {
  return {
    id: `bike-${Date.now()}-${index}`,
    name: `Bike ${index + 1}`,
    color: ['#a78bfa', '#22c55e', '#f43f5e', '#facc15'][index % 4],
    visible: true,
    locked: false,
    stack: 580,
    reach: 390,
    seatTubeAngle: 73.5,
    headTubeAngle: 73,
    crankLength: 172.5,
    saddleSetback: 0,
    stemLength: 100,
    stemAngle: -6,
    spacersBelowStem: 20,
  }
}

export default function App() {
  const [{ persistedState, consumedShareState }] = useState(loadInitialState)
  const [bikes, setBikes] = useState<BikeInput[]>(persistedState.bikes)
  const [referenceId, setReferenceId] = useState(persistedState.referenceId)
  const [rider, setRider] = useState<RiderSettings>(persistedState.rider)
  const [copyLinkLabel, setCopyLinkLabel] = useState('Copy Link')
  const [isGeometryGeeksModalOpen, setIsGeometryGeeksModalOpen] = useState(false)
  const [geometryGeeksPasteText, setGeometryGeeksPasteText] = useState('')
  const [geometryGeeksImportDefaults, setGeometryGeeksImportDefaults] = useState<GeometryGeeksImportDefaults>(
    defaultGeometryGeeksImportDefaults,
  )
  const importInputRef = useRef<HTMLInputElement>(null)
  const geometryGeeksTextareaRef = useRef<HTMLTextAreaElement>(null)
  const copyLinkTimeoutRef = useRef<number | null>(null)

  const derivedBikes = useMemo(() => bikes.map((bike) => deriveBike(bike, rider)), [bikes, rider])

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        bikes,
        referenceId,
        rider,
      }),
    )
  }, [bikes, referenceId, rider])

  useEffect(() => {
    return () => {
      if (copyLinkTimeoutRef.current !== null) {
        window.clearTimeout(copyLinkTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!isGeometryGeeksModalOpen) {
      return
    }

    geometryGeeksTextareaRef.current?.focus()
  }, [isGeometryGeeksModalOpen])

  useEffect(() => {
    if (!consumedShareState) {
      return
    }

    const cleanUrl = new URL(window.location.href)
    cleanUrl.hash = ''
    window.history.replaceState(window.history.state, '', cleanUrl.toString())
  }, [consumedShareState])

  const updateBike = (id: string, key: keyof BikeInput, value: string | number | boolean) => {
    setBikes((current) =>
      current.map((bike) => {
        if (bike.id !== id) {
          return bike
        }

        return {
          ...bike,
          [key]: value,
        }
      }),
    )
  }

  const addBike = () => {
    setBikes((current) => [...current, makeNewBike(current.length)])
  }

  const duplicateBike = (id: string) => {
    setBikes((current) => {
      const source = current.find((bike) => bike.id === id)
      if (!source) {
        return current
      }

      const clone = {
        ...source,
        id: `bike-${Date.now()}-${current.length}`,
        name: `${source.name} Copy`,
      }
      return [...current, clone]
    })
  }

  const moveBike = (id: string, direction: -1 | 1) => {
    setBikes((current) => {
      const index = current.findIndex((bike) => bike.id === id)
      if (index === -1) {
        return current
      }

      const targetIndex = index + direction
      if (targetIndex < 0 || targetIndex >= current.length) {
        return current
      }

      const next = [...current]
      const [bike] = next.splice(index, 1)
      next.splice(targetIndex, 0, bike)
      return next
    })
  }

  const removeBike = (id: string) => {
    setBikes((current) => {
      if (current.length === 1) {
        return current
      }

      const next = current.filter((bike) => bike.id !== id)
      if (referenceId === id && next[0]) {
        setReferenceId(next[0].id)
      }
      return next
    })
  }

  const updateSaddleHeight = (value: number) => {
    setRider((current) => ({
      ...current,
      saddleHeight: value,
    }))
  }

  const resetState = () => {
    const confirmed = window.confirm('Reset all bikes and rider settings back to the default sample data?')
    if (!confirmed) {
      return
    }

    const next = getDefaultPersistedState()
    window.localStorage.removeItem(STORAGE_KEY)
    setBikes(next.bikes)
    setReferenceId(next.referenceId)
    setRider(next.rider)
  }

  const setCopyLinkFeedback = (label: string) => {
    setCopyLinkLabel(label)

    if (copyLinkTimeoutRef.current !== null) {
      window.clearTimeout(copyLinkTimeoutRef.current)
    }

    copyLinkTimeoutRef.current = window.setTimeout(() => {
      setCopyLinkLabel('Copy Link')
      copyLinkTimeoutRef.current = null
    }, 2000)
  }

  const copyShareLink = async () => {
    const sharedState: PersistedState = { bikes, referenceId, rider }
    const compressedState = compressToEncodedURIComponent(JSON.stringify(sharedState))
    const shareUrl = new URL(window.location.href)
    shareUrl.hash = `${SHARE_STATE_KEY}=${compressedState}`

    try {
      await navigator.clipboard.writeText(shareUrl.toString())
      setCopyLinkFeedback('Copied')
    } catch {
      window.prompt('Copy this link:', shareUrl.toString())
      setCopyLinkFeedback('Ready')
    }
  }

  const openGeometryGeeksModal = () => {
    setIsGeometryGeeksModalOpen(true)
  }

  const closeGeometryGeeksModal = () => {
    setIsGeometryGeeksModalOpen(false)
    setGeometryGeeksPasteText('')
  }

  const updateGeometryGeeksImportDefault = (key: keyof GeometryGeeksImportDefaults, value: number) => {
    setGeometryGeeksImportDefaults((current) => ({
      ...current,
      [key]: value,
    }))
  }

  const importGeometryGeeksText = () => {
    if (!geometryGeeksPasteText.trim()) {
      return
    }

    const importedBikes = parseGeometryGeeksImport(geometryGeeksPasteText)
    if (!importedBikes) {
      window.alert('Could not parse Geometry Geeks comparison text.')
      return
    }

    const nextBikes = importedBikes.map((importedBike, index) =>
      validateBike({
        ...makeNewBike(bikes.length + index),
        ...geometryGeeksImportDefaults,
        ...importedBike,
        id: `bike-${Date.now()}-${bikes.length + index}`,
      }),
    )
    if (nextBikes.some((bike) => bike === null)) {
      window.alert('Could not import Geometry Geeks text because it contains an invalid value.')
      return
    }

    setBikes((current) => [...current, ...(nextBikes as BikeInput[])])

    closeGeometryGeeksModal()
  }

  const exportState = () => {
    const data: PersistedState = { bikes, referenceId, rider }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    const date = new Date().toISOString().slice(0, 10)
    link.href = url
    link.download = `bike-fit-compare-${date}.json`
    link.click()
    window.URL.revokeObjectURL(url)
  }

  const openImportPicker = () => {
    importInputRef.current?.click()
  }

  const importState = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    try {
      const text = await file.text()
      const next = parsePersistedState(text)
      if (!next) {
        throw new Error('Invalid import state')
      }
      setBikes(next.bikes)
      setReferenceId(next.referenceId)
      setRider(next.rider)
    } catch {
      window.alert('Could not import file. Please choose a valid Bike Fit Compare JSON export.')
    } finally {
      event.target.value = ''
    }
  }

  return (
    <main className="app-shell">
      {isGeometryGeeksModalOpen ? (
        <div className="modal-backdrop" role="presentation" onClick={closeGeometryGeeksModal}>
          <section
            className="modal-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="geometry-geeks-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2 id="geometry-geeks-modal-title">Import From Geometry Geeks</h2>
                <p>
                  Go to the Geometry Geeks comparison page, select all text on the page, copy it, then paste it below.
                </p>
              </div>
              <button type="button" className="icon-button" onClick={closeGeometryGeeksModal} aria-label="Close import dialog">
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M4 4L12 12M12 4L4 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <label className="field">
              <span>Geometry Geeks Page Text</span>
              <textarea
                ref={geometryGeeksTextareaRef}
                className="paste-textarea"
                value={geometryGeeksPasteText}
                onChange={(event) => setGeometryGeeksPasteText(event.target.value)}
                rows={14}
              />
            </label>

            <section className="modal-defaults-section">
              <div>
                <h3>Import Defaults</h3>
                <p>These values fill in fields that Geometry Geeks does not provide in the copied text.</p>
              </div>

              <div className="modal-defaults-grid">
                <label className="field">
                  <span>Crank Length</span>
                  <ValidatedNumberInput
                    value={geometryGeeksImportDefaults.crankLength}
                    min={bikeNumberLimits.crankLength.min}
                    onCommit={(value) => updateGeometryGeeksImportDefault('crankLength', value)}
                  />
                </label>

                <label className="field">
                  <span>Saddle Setback</span>
                  <ValidatedNumberInput
                    value={geometryGeeksImportDefaults.saddleSetback}
                    onCommit={(value) => updateGeometryGeeksImportDefault('saddleSetback', value)}
                  />
                </label>

                <label className="field">
                  <span>Stem Length</span>
                  <ValidatedNumberInput
                    value={geometryGeeksImportDefaults.stemLength}
                    min={bikeNumberLimits.stemLength.min}
                    onCommit={(value) => updateGeometryGeeksImportDefault('stemLength', value)}
                  />
                </label>

                <label className="field">
                  <span>Stem Angle</span>
                  <ValidatedNumberInput
                    value={geometryGeeksImportDefaults.stemAngle}
                    min={bikeNumberLimits.stemAngle.min}
                    max={bikeNumberLimits.stemAngle.max}
                    step={0.1}
                    onCommit={(value) => updateGeometryGeeksImportDefault('stemAngle', value)}
                  />
                </label>

                <label className="field">
                  <span>Spacers</span>
                  <ValidatedNumberInput
                    value={geometryGeeksImportDefaults.spacersBelowStem}
                    min={bikeNumberLimits.spacersBelowStem.min}
                    onCommit={(value) => updateGeometryGeeksImportDefault('spacersBelowStem', value)}
                  />
                </label>
              </div>
            </section>

            <div className="modal-actions">
              <button type="button" className="ghost-button" onClick={closeGeometryGeeksModal}>
                Cancel
              </button>
              <button
                type="button"
                className="solid-button"
                onClick={importGeometryGeeksText}
                disabled={!geometryGeeksPasteText.trim()}
              >
                Import
              </button>
            </div>
          </section>
        </div>
      ) : null}

      <section className="hero panel">
        <h1>Bike Position Comparison</h1>
      </section>

      <section className="layout">
        <aside className="sidebar">
          <div className="sidebar-header">
            <div className="sidebar-actions">
              <h2 className="sidebar-actions-title">Actions</h2>
              <div className="sidebar-action-group">
                <button type="button" className="ghost-button" onClick={copyShareLink}>
                  {copyLinkLabel}
                </button>
                <button type="button" className="ghost-button" onClick={exportState}>
                  Export
                </button>
                <button type="button" className="ghost-button" onClick={openImportPicker}>
                  Import
                </button>
                <button type="button" className="ghost-button" onClick={resetState}>
                  Reset
                </button>
              </div>
              <div className="sidebar-action-group sidebar-action-group-secondary">
                <button type="button" className="ghost-button" onClick={openGeometryGeeksModal}>
                  Paste GG
                </button>
                <button type="button" className="solid-button" onClick={addBike}>
                  Add Bike
                </button>
              </div>
              <input
                ref={importInputRef}
                className="sr-only"
                type="file"
                accept="application/json,.json"
                onChange={importState}
              />
            </div>
          </div>

            <section className="bike-card">
              <div className="bike-card-header">
                <div>
                  <h2 className="sidebar-actions-title">Rider Settings</h2>
                </div>
              </div>

            <div className="field-grid">
              <label className="field">
                <span className="field-label-with-help">
                  Saddle Height
                  <button
                    type="button"
                    className="help-button"
                    aria-label="Saddle height help"
                    data-tooltip="Measured from the bottom of the pedal stroke, in line with the seat tube, to the top of the saddle."
                  >
                    ?
                  </button>
                </span>
                <ValidatedNumberInput
                  value={rider.saddleHeight}
                  min={saddleHeightLimits.min}
                  onCommit={updateSaddleHeight}
                />
              </label>
            </div>
          </section>

          <div className="bike-list">
            {bikes.map((bike) => (
              <BikeForm
                key={bike.id}
                bike={bike}
                onChange={updateBike}
                onRemove={removeBike}
                onDuplicate={duplicateBike}
                onMoveUp={(id) => moveBike(id, -1)}
                onMoveDown={(id) => moveBike(id, 1)}
                onSetReference={setReferenceId}
                isReference={referenceId === bike.id}
                canRemove={bikes.length > 1}
                canMoveUp={bikes[0]?.id !== bike.id}
                canMoveDown={bikes[bikes.length - 1]?.id !== bike.id}
              />
            ))}
          </div>
        </aside>

        <section className="main-content">
          <ComparisonChart bikes={derivedBikes} />
          <ComparisonTable bikes={derivedBikes} referenceId={referenceId} />
        </section>
      </section>
    </main>
  )
}
