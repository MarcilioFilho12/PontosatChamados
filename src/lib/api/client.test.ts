import { describe, expect, it } from 'vitest'
import { profileFormSchema, ticketFormSchema } from '@/lib/validation/schemas'
import { serializeFilters } from '@/lib/validation/filters'
import { pageCount } from '@/lib/pagination'
import { clearSession, readSession, writeSession } from '@/lib/api/session'
import { fieldErrorsFromDetail } from '@/lib/api/errors'
import { statusLabel } from '@/lib/format'

describe('validação', () => {
  it('exige título e descrição do chamado', () => {
    const parsed = ticketFormSchema.safeParse({ title: '', description: '   ', status: 'open' })
    expect(parsed.success).toBe(false)
  })

  it('aceita um chamado dentro do contrato', () => {
    const parsed = ticketFormSchema.safeParse({
      title: 'Acesso',
      description: 'Não consigo entrar.',
      status: 'in_progress',
    })
    expect(parsed.success).toBe(true)
  })

  it('exige confirmação igual quando a senha muda', () => {
    const parsed = profileFormSchema.safeParse({
      name: 'Ana',
      currentPassword: 'atual',
      password: 'nova',
      passwordConfirmation: 'outra',
    })
    expect(parsed.success).toBe(false)
  })
})

describe('filtros e paginação', () => {
  it('omite grupos vazios', () => {
    expect(serializeFilters({ and: [], or: [] })).toBeUndefined()
  })

  it('recusa filtro acima de 20.000 caracteres', () => {
    expect(() =>
      serializeFilters({ and: [{ column: 'title', op: 'ilike', value: 'a'.repeat(20_001) }] }),
    ).toThrow(/20\.000/)
  })

  it('calcula a quantidade de páginas', () => {
    expect(pageCount(0, 20)).toBe(1)
    expect(pageCount(21, 20)).toBe(2)
  })
})

describe('sessão', () => {
  it('descarta token expirado', () => {
    sessionStorage.setItem(
      'pontosat.session',
      JSON.stringify({ accessToken: 'abc', expiresAt: Date.now() - 1_000 }),
    )
    expect(readSession()).toBeNull()
    expect(sessionStorage.getItem('pontosat.session')).toBeNull()
  })

  it('grava e lê a sessão vigente', () => {
    clearSession()
    writeSession('token-teste', 1800)
    expect(readSession()?.accessToken).toBe('token-teste')
    clearSession()
  })
})

describe('erros da API', () => {
  it('associa a mensagem ao campo', () => {
    expect(fieldErrorsFromDetail([{ loc: ['body', 'email'], msg: 'E-mail inválido.', type: 'value_error' }])).toEqual({
      email: 'E-mail inválido.',
    })
  })

  it('traduz o status do chamado', () => {
    expect(statusLabel('in_progress')).toBe('Em atendimento')
  })
})
