import type { FilterPayload } from '@/lib/api/types'

const MAX_FILTER_LENGTH = 20_000

export function serializeFilters(filters: FilterPayload | undefined): string | undefined {
  if (!filters) return undefined

  const payload: FilterPayload = {}
  if (filters.and && filters.and.length > 0) payload.and = filters.and
  if (filters.or && filters.or.length > 0) payload.or = filters.or
  if (!payload.and && !payload.or) return undefined

  const raw = JSON.stringify(payload)
  if (raw.length > MAX_FILTER_LENGTH) {
    throw new Error('O filtro passou do limite de 20.000 caracteres.')
  }
  return raw
}
