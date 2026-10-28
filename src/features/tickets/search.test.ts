import { describe, expect, it } from 'vitest'
import { matchingOwnerIds, ticketIdFromTerm, ticketLookup } from '@/features/tickets/search'

describe('busca de chamados', () => {
  it('reconhece o número com ou sem cerquilha', () => {
    expect(ticketIdFromTerm('42')).toBe(42)
    expect(ticketIdFromTerm('#7')).toBe(7)
    expect(ticketIdFromTerm('0')).toBeNull()
    expect(ticketIdFromTerm('12a')).toBeNull()
  })

  it('procura o chamado pelo id quando o termo é numérico', () => {
    expect(ticketLookup('#15', [3])).toEqual({ and: [{ column: 'id', op: 'eq', value: 15 }] })
  })

  it('procura o título e quem abriu quando o termo é um nome', () => {
    expect(ticketLookup('Elisa', [4, 8])).toEqual({
      or: [
        { column: 'title', op: 'ilike', value: 'Elisa' },
        { column: 'id_user', op: 'in', value: [4, 8] },
      ],
    })
  })

  it('procura no texto do chamado quando ninguém tem esse nome', () => {
    expect(ticketLookup('ERP', [])).toEqual({
      or: [
        { column: 'title', op: 'ilike', value: 'ERP' },
        { column: 'description', op: 'ilike', value: 'ERP' },
      ],
    })
  })

  it('casa o nome sem diferenciar maiúsculas nem acentos', () => {
    expect(matchingOwnerIds('eli', [{ id: 4, name: 'Elisa Costa' }, { id: 4, name: 'Elisa Costa' }])).toEqual([4])
    expect(matchingOwnerIds('joao', [{ id: 11, name: 'João Pereira' }])).toEqual([11])
    expect(matchingOwnerIds('42', [{ id: 4, name: 'Sala 42' }])).toEqual([])
  })
})
