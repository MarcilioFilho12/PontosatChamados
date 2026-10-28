import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppProviders } from '@/app/auth-context'
import { appRoutes } from '@/app/router'
import { apiRequest } from '@/lib/api/client'
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

describe('login e rotas', () => {
  beforeEach(() => {
    clearSession()
    vi.unstubAllGlobals()
  })

  it('mostra erros de validação junto aos campos', async () => {
    const user = userEvent.setup()
    renderAt('/entrar')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByText('Informe um e-mail válido.')).toBeInTheDocument()
    expect(screen.getByText('Informe a senha.')).toBeInTheDocument()
  })

  it('impede o segundo envio enquanto o login não responde', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn(() => new Promise<Response>(() => undefined))
    vi.stubGlobal('fetch', fetchMock)
    renderAt('/entrar')
    await user.type(screen.getByLabelText('E-mail'), 'ana@example.com')
    await user.type(screen.getByLabelText('Senha'), 'segredo')
    const button = screen.getByRole('button', { name: 'Entrar' })
    await user.click(button)
    await user.click(button)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(button).toBeDisabled()
  })

  it('envia quem não tem sessão para o login', async () => {
    renderAt('/')
    expect(await screen.findByRole('heading', { name: /o chamado deixa de se perder/i })).toBeInTheDocument()
  })

  it('bloqueia a gestão de usuários para o papel user', async () => {
    writeSession('token-teste', 1800)
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
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
        return json({ type: 'success', message: 'ok', data: [], meta: { total: 0 } })
      }),
    )
    renderAt('/usuarios')
    expect(await screen.findByRole('heading', { name: /acesso restrito/i })).toBeInTheDocument()
  })
})

describe('cliente HTTP', () => {
  beforeEach(() => {
    clearSession()
    vi.unstubAllGlobals()
  })

  it('trata 401 com a mensagem da API e encerra a sessão', async () => {
    writeSession('token-teste', 1800)
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => json({ detail: 'Faça login para continuar.' }, 401)),
    )
    await expect(apiRequest('/api/v2/tickets')).rejects.toMatchObject({
      kind: 'unauthorized',
      message: 'Faça login para continuar.',
    })
    expect(sessionStorage.getItem('pontosat.session')).toBeNull()
  })
})
