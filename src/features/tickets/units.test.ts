import { describe, expect, it } from 'vitest'
import { isTicketUnit, unitCondition } from '@/features/tickets/units'

describe('filtro de unidade', () => {
  it('reconhece só as unidades que aparecem nos chamados', () => {
    expect(isTicketUnit('São Paulo — Matriz')).toBe(true)
    expect(isTicketUnit('Outra cidade')).toBe(false)
  })

  it('procura a unidade no texto documentado da descrição', () => {
    expect(unitCondition('Curitiba — Filial')).toEqual({
      column: 'description',
      op: 'ilike',
      value: '**Unidade:** Curitiba — Filial',
    })
  })
})
