import type { FilterCondition } from '@/lib/api/types'

export const ticketUnits = [
  'Belo Horizonte — Escritório',
  'Campinas — Centro de distribuição',
  'Curitiba — Filial',
  'Recife — Operação regional',
  'São Paulo — Matriz',
] as const

export type TicketUnit = (typeof ticketUnits)[number]

export function isTicketUnit(value: string): value is TicketUnit {
  return ticketUnits.includes(value as TicketUnit)
}

export function unitCondition(unit: TicketUnit): FilterCondition {
  return { column: 'description', op: 'ilike', value: `**Unidade:** ${unit}` }
}

