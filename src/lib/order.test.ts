import { describe, expect, it } from 'vitest'
import { compareByDate, toggleOrder } from '@/lib/order'

describe('ordem', () => {
  it('alterna crescente e decrescente', () => {
    expect(toggleOrder('asc')).toBe('desc')
    expect(toggleOrder('desc')).toBe('asc')
  })

  it('ordena datas nos dois sentidos', () => {
    const older = '2026-01-01T00:00:00Z'
    const newer = '2026-06-01T00:00:00Z'
    expect(compareByDate(older, newer, 'asc')).toBeLessThan(0)
    expect(compareByDate(older, newer, 'desc')).toBeGreaterThan(0)
  })
})
