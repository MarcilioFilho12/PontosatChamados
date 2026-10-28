import { render, screen } from '@testing-library/react'
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

const account = {
  id: 2,
  uuid: '6b1b5c3a-2d4e-4f77-9a11-2b0e6d5a7c31',
  name: 'Ana Lima',
  email: 'ana@example.com',
  role: 'user',
  createdAt: '2026-01-01T12:00:00Z',
  updatedAt: '2026-02-01T12:00:00Z',
}

describe('perfil', () => {
  beforeEach(() => {
    clearSession()
    vi.unstubAllGlobals()
    writeSession('token-teste', 1800)
  })

  it('mostra os dados da conta e só abre a edição no botão', async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input)
        if (url.includes('/api/v2/me')) {
          return json({ type: 'success', message: 'ok', data: account })
        }
        if (url.includes('/api/v2/tickets')) {
          const filters = new URL(url).searchParams.get('filters') ?? ''
          const total = filters.includes('in_progress') ? 4 : filters.includes('closed') ? 9 : 2
          return json({ type: 'success', message: 'ok', data: [], meta: { total } })
        }
        return json({ type: 'success', message: 'ok', data: [] })
      }),
    )

    renderAt('/perfil')

    expect(await screen.findByRole('heading', { name: 'Ana Lima' })).toBeInTheDocument()
    expect(screen.getByText('ana@example.com')).toBeInTheDocument()
    expect(screen.getByText('Abre chamados, acompanha os que são desta conta e responde na conversa.')).toBeInTheDocument()
    expect(await screen.findByText('2')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('9')).toBeInTheDocument()
    expect(screen.queryByLabelText('Senha atual')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Editar perfil' }))
    expect(screen.getByLabelText('Senha atual')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Ana Lima')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Fechar edição' }))
    expect(screen.queryByLabelText('Senha atual')).not.toBeInTheDocument()
  })
})

