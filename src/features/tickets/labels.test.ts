import { describe, expect, it } from 'vitest'
import { matchesLabels, nextLabels, ticketLabelsFor } from '@/features/tickets/labels'

describe('etiquetas do chamado', () => {
  it('liga e desliga uma etiqueta', () => {
    expect(nextLabels([], 'urgencia')).toEqual(['urgencia'])
    expect(nextLabels(['urgencia'], 'urgencia')).toEqual([])
  })

  it('troca complexo por simples', () => {
    expect(nextLabels(['urgencia', 'complexo'], 'simples')).toEqual(['urgencia', 'simples'])
  })

  it('não aplica etiqueta em chamado finalizado', () => {
    expect(ticketLabelsFor('closed', ['urgencia'])).toEqual([])
    expect(ticketLabelsFor('open', ['urgencia'])).toEqual(['urgencia'])
  })

  it('filtra só os chamados que têm todas as etiquetas pedidas', () => {
    expect(matchesLabels(['urgencia', 'complexo'], ['urgencia'])).toBe(true)
    expect(matchesLabels(['simples'], ['urgencia'])).toBe(false)
    expect(matchesLabels(['urgencia'], [])).toBe(true)
  })
})
