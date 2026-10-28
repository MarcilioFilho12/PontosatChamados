import { useSyncExternalStore } from 'react'
import type { TicketStatus } from '@/lib/api/types'

export const ticketLabels = ['urgencia', 'complexo', 'simples'] as const

export type TicketLabel = (typeof ticketLabels)[number]

const storageKey = 'pontosat.etiquetas'
const changeEvent = 'pontosat:etiquetas'
const empty: Record<number, TicketLabel[]> = {}

let snapshot = empty
let snapshotRaw = ''

const labelNames: Record<TicketLabel, string> = {
  urgencia: 'Urgência',
  complexo: '+ complexo',
  simples: '+ simples',
}

export function labelName(label: TicketLabel): string {
  return labelNames[label]
}

export function nextLabels(current: TicketLabel[], label: TicketLabel): TicketLabel[] {
  if (current.includes(label)) return current.filter((item) => item !== label)
  const opposite = label === 'complexo' ? 'simples' : label === 'simples' ? 'complexo' : null
  const base = opposite ? current.filter((item) => item !== opposite) : current
  return [...base, label]
}

export function matchesLabels(current: TicketLabel[], required: TicketLabel[]): boolean {
  return required.every((label) => current.includes(label))
}

export function ticketLabelsFor(status: TicketStatus, stored: TicketLabel[] | undefined): TicketLabel[] {
  if (status === 'closed') return []
  return stored ?? []
}

function isLabel(value: unknown): value is TicketLabel {
  return ticketLabels.includes(value as TicketLabel)
}

function parseLabels(raw: string): Record<number, TicketLabel[]> {
  if (!raw) return empty
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return empty
    const next: Record<number, TicketLabel[]> = {}
    for (const [key, value] of Object.entries(parsed)) {
      const id = Number(key)
      if (!Number.isSafeInteger(id) || id < 1 || !Array.isArray(value)) continue
      const labels = value.filter(isLabel)
      if (labels.length > 0) next[id] = labels
    }
    return next
  } catch {
    return empty
  }
}

export function readLabels(): Record<number, TicketLabel[]> {
  if (typeof localStorage === 'undefined') return empty
  const raw = localStorage.getItem(storageKey) ?? ''
  if (raw === snapshotRaw) return snapshot
  snapshotRaw = raw
  snapshot = parseLabels(raw)
  return snapshot
}

function writeLabels(next: Record<number, TicketLabel[]>) {
  const raw = JSON.stringify(next)
  localStorage.setItem(storageKey, raw)
  snapshotRaw = raw
  snapshot = next
  window.dispatchEvent(new Event(changeEvent))
}

function subscribe(listener: () => void) {
  window.addEventListener(changeEvent, listener)
  window.addEventListener('storage', listener)
  return () => {
    window.removeEventListener(changeEvent, listener)
    window.removeEventListener('storage', listener)
  }
}

export function useTicketLabels() {
  const labels = useSyncExternalStore(subscribe, readLabels, () => empty)
  function toggle(id: number, label: TicketLabel) {
    const current = readLabels()
    const next = { ...current, [id]: nextLabels(current[id] ?? [], label) }
    if (next[id].length === 0) delete next[id]
    writeLabels(next)
  }
  return { labels, toggle }
}
