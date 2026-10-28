export type SortOrder = 'asc' | 'desc'

export function toggleOrder(order: SortOrder): SortOrder {
  return order === 'asc' ? 'desc' : 'asc'
}

export function compareByDate(left: string, right: string, order: SortOrder): number {
  const start = Date.parse(left)
  const end = Date.parse(right)
  const safeStart = Number.isNaN(start) ? 0 : start
  const safeEnd = Number.isNaN(end) ? 0 : end
  return order === 'asc' ? safeStart - safeEnd : safeEnd - safeStart
}
