import type { FilterPayload } from '@/lib/api/types'

export function ticketIdFromTerm(term: string): number | null {
  const match = /^#?(\d+)$/.exec(term.trim())
  if (!match) return null
  const value = Number(match[1])
  if (!Number.isSafeInteger(value) || value < 1) return null
  return value
}

export function foldText(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase()
}

export function nameMatches(term: string, name: string): boolean {
  const needle = foldText(term.trim())
  if (!needle || ticketIdFromTerm(term) !== null) return false
  return foldText(name).includes(needle)
}

export function matchingOwnerIds(term: string, people: { id: number; name: string }[]): number[] {
  const ids: number[] = []
  for (const person of people) {
    if (!nameMatches(term, person.name) || ids.includes(person.id)) continue
    ids.push(person.id)
  }
  return ids
}

export function ticketLookup(term: string, ownerIds: number[]): FilterPayload {
  const text = term.trim()
  if (!text) return {}
  const id = ticketIdFromTerm(text)
  if (id !== null) return { and: [{ column: 'id', op: 'eq', value: id }] }
  const or: NonNullable<FilterPayload['or']> = [{ column: 'title', op: 'ilike', value: text }]
  if (ownerIds.length > 0) or.push({ column: 'id_user', op: 'in', value: ownerIds })
  else or.push({ column: 'description', op: 'ilike', value: text })
  return { or }
}
