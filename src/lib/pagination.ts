export const PAGE_SIZE = 20

export function pageCount(total: number, limit: number): number {
  if (total <= 0 || limit <= 0) return 1
  return Math.ceil(total / limit)
}

const operatorLabels: Record<string, string> = {
  eq: 'Igual a',
  ne: 'Diferente de',
  ilike: 'Contém',
  gte: 'A partir de',
  lte: 'Até',
  in: 'Um destes',
}

export function operatorLabel(operator: string): string {
  return operatorLabels[operator] ?? operator
}
