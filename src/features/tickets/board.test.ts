import { describe, expect, it } from 'vitest'
import { canMove, longestWaitingId, relocatePage, statusChangeBody } from '@/features/tickets/board'
import type { Page, Ticket } from '@/lib/api/types'

const ticket: Ticket = {
  id: 9,
  uuid: '11111111-1111-4111-8111-111111111111',
  title: 'Porta com defeito',
  description: 'A porta da sala não fecha.',
  status: 'open',
  id_user: 2,
  date_created: '2026-10-01T12:00:00Z',
  date_updated: '2026-10-02T12:00:00Z',
}

function page(items: Ticket[], total = items.length): Page<Ticket> {
  return { items, total, message: 'ok' }
}

describe('quadro de chamados', () => {
  it('ignora soltura na mesma coluna', () => {
    const source = page([ticket])
    expect(canMove('open', 'open')).toBe(false)
    expect(relocatePage(source, 'open', ticket, 'open')).toBe(source)
  })

  it('só aceita o próximo estado e um corpo completo', () => {
    expect(canMove('open', 'closed')).toBe(false)
    expect(canMove('in_progress', 'open')).toBe(true)
    expect(canMove('closed', 'open')).toBe(false)
    expect(canMove('in_progress', 'closed')).toBe(true)
    expect(
      statusChangeBody({ ...ticket, status: 'in_progress' }, 'open'),
    ).toMatchObject({ status: 'open' })
    expect(statusChangeBody(ticket, 'in_progress')).toEqual({
      title: ticket.title,
      description: ticket.description,
      status: 'in_progress',
    })
    expect(statusChangeBody(ticket, 'closed')).toBeNull()
    expect(statusChangeBody({ ...ticket, title: '   ' }, 'in_progress')).toBeNull()
    expect(relocatePage(page([ticket]), 'open', ticket, 'closed')).toEqual(page([ticket]))
  })

  it('marca o aberto mais antigo entre os cards carregados', () => {
    const newer = { ...ticket, id: 10, date_created: '2026-10-03T12:00:00Z' }
    expect(longestWaitingId([newer, ticket])).toBe(9)
  })

  it('move o card da coluna de origem para a de destino', () => {
    const source = page([ticket])
    const destination = page([])
    expect(relocatePage(source, 'open', ticket, 'in_progress').items).toEqual([])
    expect(relocatePage(destination, 'in_progress', ticket, 'in_progress').items).toEqual([
      { ...ticket, status: 'in_progress' },
    ])
  })
})
