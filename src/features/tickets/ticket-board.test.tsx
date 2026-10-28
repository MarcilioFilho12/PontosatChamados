import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppProviders } from '@/app/auth-context'
import { appRoutes } from '@/app/router'
import { clearSession, writeSession } from '@/lib/api/session'

function renderAt(path: string) {
  const router = createMemoryRouter(appRoutes, { initialEntries: [path] })
  return render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  )
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

const ticket = {
  id: 9,
  uuid: '11111111-1111-4111-8111-111111111111',
  title: 'Porta com defeito',
  description: 'A porta da sala não fecha.',
  status: 'open',
  id_user: 2,
  date_created: '2026-10-01T12:00:00Z',
  date_updated: '2026-10-02T12:00:00Z',
}

describe('quadro de chamados', () => {
  beforeEach(() => {
    clearSession()
    vi.unstubAllGlobals()
    writeSession('token-teste', 1800)
  })

  it('devolve o card para a coluna anterior quando a mudança de status falha', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url.includes('/api/v2/me')) {
        return json({
          type: 'success',
          message: 'ok',
          data: {
            id: 2,
            uuid: '6b1b5c3a-2d4e-4f77-9a11-2b0e6d5a7c31',
            name: 'Ana',
            email: 'ana@example.com',
            role: 'user',
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        })
      }
      if (url.includes('/api/v2/tickets/filters')) {
        return json({ type: 'success', message: 'ok', data: [] })
      }
      if (url.includes('/api/v2/tickets') && init?.method === 'PUT') {
        return json({ detail: 'Não foi possível mover o chamado.' }, 500)
      }
      if (url.includes('/api/v2/tickets')) {
        const filters = new URL(url).searchParams.get('filters') ?? ''
        if (filters.includes('"in_progress"') || filters.includes('"closed"')) {
          return json({ type: 'success', message: 'ok', data: [], meta: { total: 0 } })
        }
        return json({ type: 'success', message: 'ok', data: [ticket], meta: { total: 1 } })
      }
      return json({ type: 'success', message: 'ok', data: [] })
    })
    vi.stubGlobal('fetch', fetchMock)

    renderAt('/')
    expect(await screen.findByRole('link', { name: 'Porta com defeito' })).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: /^Aberto/ })).getByRole('link', { name: 'Porta com defeito' })).toBeInTheDocument()

    await user.selectOptions(screen.getByRole('combobox', { name: 'Mover Porta com defeito' }), 'in_progress')
    expect(fetchMock.mock.calls.filter((call) => call[1]?.method === 'PUT')).toHaveLength(0)
    const panel = await screen.findByRole('dialog', { name: /em atendimento/i })
    await user.click(within(panel).getByRole('button', { name: 'Confirmar' }))

    expect(await within(panel).findByRole('alert')).toHaveTextContent('Não foi possível mover o chamado.')
    expect(within(panel).getByRole('alert')).toHaveTextContent('permanece em Aberto')
    expect(panel).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: /^Aberto/ })).getByRole('link', { name: 'Porta com defeito' })).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: /^Em atendimento/ })).queryByRole('link', { name: 'Porta com defeito' })).not.toBeInTheDocument()

    const put = fetchMock.mock.calls.find((call) => call[1]?.method === 'PUT')
    expect(put?.[1]?.body).toContain('"title":"Porta com defeito"')
    expect(put?.[1]?.body).toContain('"description":"A porta da sala não fecha."')
    expect(put?.[1]?.body).toContain('"status":"in_progress"')
    expect(fetchMock.mock.calls.filter((call) => call[1]?.method === 'PUT')).toHaveLength(1)
  })
})
