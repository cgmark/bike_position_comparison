import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'
import { useEffect, useMemo, useRef, useState } from 'react'
import BikeForm from './components/BikeForm'
import ComparisonChart from './components/ComparisonChart'
import ComparisonTable from './components/ComparisonTable'
import { deriveBike } from './geometry'
import type { BikeInput, RiderSettings } from './types'

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

type PersistedState = {
  bikes: BikeInput[]
  referenceId: string
  rider: RiderSettings
}

function getDefaultPersistedState(): PersistedState {
  return {
    bikes: sampleBikes,
    referenceId: sampleBikes[0].id,
    rider: defaultRiderSettings,
  }
}

function normalizePersistedState(parsed: Partial<PersistedState>): PersistedState {
  const fallback = getDefaultPersistedState()
  const bikes =
    Array.isArray(parsed.bikes) && parsed.bikes.length > 0
      ? parsed.bikes.map((bike, index) => normalizeBike(bike, makeNewBike(index)))
      : fallback.bikes
  const referenceId =
    typeof parsed.referenceId === 'string' && bikes.some((bike) => bike.id === parsed.referenceId)
      ? parsed.referenceId
      : bikes[0].id
  const rider = {
    ...defaultRiderSettings,
    ...parsed.rider,
  }

  return { bikes, referenceId, rider }
}

function parsePersistedState(raw: string): PersistedState | null {
  try {
    const parsed = JSON.parse(raw) as Partial<PersistedState>
    return normalizePersistedState(parsed)
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

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return null
  }

  return parsePersistedState(raw)
}

function loadInitialState(): PersistedState {
  return loadShareState() ?? loadPersistedState() ?? getDefaultPersistedState()
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

function normalizeBike(bike: Partial<BikeInput>, fallback: BikeInput): BikeInput {
  return {
    ...fallback,
    ...bike,
    locked: typeof bike.locked === 'boolean' ? bike.locked : false,
    saddleSetback: typeof bike.saddleSetback === 'number' ? bike.saddleSetback : 0,
  }
}

const preventWheelValueChange = (event: React.WheelEvent<HTMLInputElement>) => {
  event.currentTarget.blur()
}

export default function App() {
  const [persistedState] = useState(loadInitialState)
  const [bikes, setBikes] = useState<BikeInput[]>(persistedState.bikes)
  const [referenceId, setReferenceId] = useState(persistedState.referenceId)
  const [rider, setRider] = useState<RiderSettings>(persistedState.rider)
  const [copyLinkLabel, setCopyLinkLabel] = useState('Copy Link')
  const importInputRef = useRef<HTMLInputElement>(null)
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
      const parsed = JSON.parse(text) as Partial<PersistedState>
      const next = normalizePersistedState(parsed)
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
      <section className="hero panel">
        <h1>Bike Position Comparison</h1>
      </section>

      <section className="layout">
        <aside className="sidebar">
          <div className="sidebar-header">
            <div>
              <h2>Bikes</h2>
              <p>Edit geometry and fit inputs for each bike.</p>
            </div>
            <div className="sidebar-actions">
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
              <button type="button" className="solid-button" onClick={addBike}>
                Add Bike
              </button>
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
                <h3>Rider Settings</h3>
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
                    title="Measured from the bottom of the pedal stroke, in line with the seat tube, to the top of the saddle."
                  >
                    ?
                  </button>
                </span>
                <input
                  type="number"
                  step="1"
                  value={rider.saddleHeight}
                  onWheel={preventWheelValueChange}
                  onChange={(event) => updateSaddleHeight(Number(event.target.value))}
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
