import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppProviders } from '@/app/auth-context'
import { DeskPulse } from '@/features/tickets/desk-pulse'
import { clearSession, writeSession } from '@/lib/api/session'

function json(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

const account = {
  id: 2,
  uuid: '6b1b5c3a-2d4e-4f77-9a11-2b0e6d5a7c31',
  name: 'Ana Lima',
  email: 'ana@example.com',
  role: 'user',
  createdAt: '2026-01-01T12:00:00Z',
  updatedAt: '2026-02-01T12:00:00Z',
}

const filterFields = [
  { value: 'status', name: 'Situação', type: 'enum', operators: ['eq'] },
  { value: 'date_created', name: 'Abertura', type: 'datetime', operators: ['gte'] },
  { value: 'date_updated', name: 'Alteração', type: 'datetime', operators: ['gte'] },
]

describe('pulso da fila', () => {
  beforeEach(() => {
    clearSession()
    vi.unstubAllGlobals()
    writeSession('token-teste', 1800)
  })

  it('mostra os quatro recortes da fila', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input)
        if (url.includes('/api/v2/me')) return json({ type: 'success', message: 'ok', data: account })
        if (url.includes('/api/v2/tickets/filters')) {
          return json({ type: 'success', message: 'ok', data: filterFields })
        }
        if (url.includes('/api/v2/tickets')) {
          const filters = new URL(url).searchParams.get('filters') ?? ''
          const total = filters.includes('date_updated')
            ? 9
            : filters.includes('date_created')
              ? 2
              : filters.includes('in_progress')
                ? 4
                : 3
          return json({ type: 'success', message: 'ok', data: [], meta: { total } })
        }
        return json({ type: 'success', message: 'ok', data: [] })
      }),
    )

    render(
      <AppProviders>
        <DeskPulse />
      </AppProviders>,
    )

    expect(await screen.findAllByText('03')).not.toHaveLength(0)
    expect(screen.getAllByText('04').length).toBeGreaterThan(0)
    expect((await screen.findAllByText('02')).length).toBeGreaterThan(0)
    expect(screen.getAllByText('09').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Abertos agora').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Em atendimento').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Última hora').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Finalizados em 6h').length).toBeGreaterThan(0)
    expect(screen.getAllByText('última alteração').length).toBeGreaterThan(0)
    expect(screen.getByText('Pulso da fila')).toBeInTheDocument()
    expect(screen.getByText('Ao vivo')).toBeInTheDocument()
  })
})
