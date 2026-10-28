import type { Page, Ticket, TicketStatus } from '@/lib/api/types'

const allowedMoves: Record<TicketStatus, TicketStatus[]> = {
  open: ['in_progress'],
  in_progress: ['open', 'closed'],
  closed: [],
}

export function moveTargets(status: TicketStatus): TicketStatus[] {
  return allowedMoves[status]
}

export function canMove(from: TicketStatus, to: TicketStatus): boolean {
  return allowedMoves[from].includes(to)
}

export function statusChangeBody(
  ticket: Ticket,
  to: TicketStatus,
): { title: string; description: string; status: TicketStatus } | null {
  if (!canMove(ticket.status, to)) return null
  const title = ticket.title.trim()
  const description = ticket.description.trim()
  if (title.length === 0 || title.length > 255 || description.length === 0) return null
  return { title, description, status: to }
}

export function longestWaitingId(tickets: Ticket[]): number | null {
  let oldest: Ticket | null = null
  for (const ticket of tickets) {
    if (ticket.status !== 'open') continue
    const time = Date.parse(ticket.date_created)
    if (Number.isNaN(time)) continue
    if (!oldest || time < Date.parse(oldest.date_created)) oldest = ticket
  }
  return oldest?.id ?? null
}

export function columnFromKey(key: readonly unknown[]): TicketStatus | null {
  const value = key[2]
  if (value === 'open' || value === 'in_progress' || value === 'closed') return value
  return null
}

export function relocatePage(page: Page<Ticket>, column: TicketStatus, ticket: Ticket, to: TicketStatus): Page<Ticket> {
  if (!canMove(ticket.status, to)) return page

  if (column === ticket.status) {
    const items = page.items.filter((item) => item.id !== ticket.id)
    if (items.length === page.items.length) return page
    return { ...page, items, total: Math.max(0, page.total - 1) }
  }

  if (column === to) {
    const moved = { ...ticket, status: to }
    if (page.items.some((item) => item.id === ticket.id)) {
      return { ...page, items: page.items.map((item) => (item.id === ticket.id ? moved : item)) }
    }
    return { ...page, items: [moved, ...page.items], total: page.total + 1 }
  }

  return page
}
