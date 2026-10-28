import { ApiError } from '@/lib/api/errors'
import { apiRequest } from '@/lib/api/client'
import type {
  FilterField,
  FilterPayload,
  Interaction,
  InteractionListParams,
  Page,
  Role,
  Ticket,
  TicketListParams,
  TicketStatus,
  User,
  UserListParams,
} from '@/lib/api/types'
import { serializeFilters } from '@/lib/validation/filters'
import {
  interactionSchema,
  loginTokenSchema,
  parseFilterFields,
  parseItem,
  parseList,
  ticketSchema,
  userSchema,
} from '@/lib/validation/schemas'

const THREAD_PAGE = 100
const THREAD_PAGE_CAP = 5
const COLUMN_PAGE = 100
const COLUMN_PAGE_CAP = 5

function asPage<T>(items: T[], total: number | null, message: string): Page<T> {
  return { items, total: total ?? items.length, message }
}

function unexpected(error: unknown): never {
  if (error instanceof ApiError) throw error
  throw new ApiError(error instanceof Error ? error.message : 'A API retornou um formato inesperado.', {
    kind: 'parse',
  })
}

export async function login(email: string, password: string): Promise<{ accessToken: string; expiresIn: number }> {
  const result = await apiRequest('/api/v2/login', {
    method: 'POST',
    auth: false,
    body: { email, password },
  })
  const token = loginTokenSchema.safeParse(result.data)
  if (!token.success) {
    throw new ApiError('A API não devolveu uma sessão válida.', { kind: 'parse' })
  }
  return { accessToken: token.data.access_token, expiresIn: token.data.expires_in ?? 1800 }
}

export async function fetchMe(): Promise<User> {
  const result = await apiRequest('/api/v2/me')
  try {
    return parseItem(userSchema, result.data, 'o usuário logado')
  } catch (error) {
    unexpected(error)
  }
}

export async function updateProfile(body: {
  name: string
  currentPassword: string
  password?: string
  passwordConfirmation?: string
}): Promise<User> {
  const result = await apiRequest('/api/v2/users/profile', { method: 'PUT', body })
  try {
    return parseItem(userSchema, result.data, 'o perfil')
  } catch (error) {
    unexpected(error)
  }
}

export async function listUsers(params: UserListParams): Promise<Page<User>> {
  const result = await apiRequest('/api/v2/users', {
    query: {
      offset: params.offset,
      limit: params.limit,
      search: params.search,
      role: params.role,
      orderColumn: params.orderColumn,
      orderBy: params.orderBy,
      filters: serializeFilters(params.filters),
    },
  })
  try {
    return asPage(parseList(userSchema, result.data, 'os usuários'), result.total, result.message)
  } catch (error) {
    unexpected(error)
  }
}

export async function listAllUsers(): Promise<User[]> {
  const first = await listUsers({ offset: 0, limit: 100, orderColumn: 'name', orderBy: 'asc' })
  const items = [...first.items]
  const pages = Math.min(Math.ceil(first.total / 100), 5)
  for (let page = 1; page < pages; page += 1) {
    const next = await listUsers({ offset: page * 100, limit: 100, orderColumn: 'name', orderBy: 'asc' })
    items.push(...next.items)
  }
  return items
}

export async function getUser(id: number): Promise<User> {
  const page = await listUsers({
    offset: 0,
    limit: 1,
    filters: { and: [{ column: 'id', op: 'eq', value: id }] },
  })
  const user = page.items[0]
  if (!user) throw new ApiError('Usuário não encontrado.', { status: 404, kind: 'not_found' })
  return user
}

export async function getUserFilters(): Promise<FilterField[]> {
  const result = await apiRequest('/api/v2/users/filters')
  try {
    return parseFilterFields(result.data, 'os filtros de usuários')
  } catch (error) {
    unexpected(error)
  }
}

export async function createUser(body: {
  name: string
  email: string
  password: string
  role: Role
}): Promise<User> {
  const result = await apiRequest('/api/v2/users', { method: 'POST', body })
  try {
    return parseItem(userSchema, result.data, 'o usuário')
  } catch (error) {
    unexpected(error)
  }
}

export async function updateUser(
  userId: number,
  body: { name: string; role: Role; password?: string },
): Promise<User> {
  const result = await apiRequest(`/api/v2/users/${userId}`, { method: 'PUT', body })
  try {
    return parseItem(userSchema, result.data, 'o usuário')
  } catch (error) {
    unexpected(error)
  }
}

export async function deleteUser(userId: number): Promise<void> {
  await apiRequest(`/api/v2/users/${userId}`, { method: 'DELETE' })
}

export async function listTickets(params: TicketListParams): Promise<Page<Ticket>> {
  const result = await apiRequest('/api/v2/tickets', {
    query: {
      offset: params.offset,
      limit: params.limit,
      filters: serializeFilters(params.filters),
    },
  })
  try {
    return asPage(parseList(ticketSchema, result.data, 'os chamados'), result.total, result.message)
  } catch (error) {
    unexpected(error)
  }
}

export async function getTicketFilters(): Promise<FilterField[]> {
  const result = await apiRequest('/api/v2/tickets/filters')
  try {
    return parseFilterFields(result.data, 'os filtros de chamados')
  } catch (error) {
    unexpected(error)
  }
}

export async function listColumnTickets(filters: FilterPayload): Promise<Page<Ticket>> {
  const first = await listTickets({ offset: 0, limit: COLUMN_PAGE, filters })
  const pages = Math.min(Math.ceil(first.total / COLUMN_PAGE), COLUMN_PAGE_CAP)
  const rest = await Promise.all(
    Array.from({ length: Math.max(pages - 1, 0) }, (_, index) =>
      listTickets({ offset: (index + 1) * COLUMN_PAGE, limit: COLUMN_PAGE, filters }),
    ),
  )
  return {
    items: [first, ...rest].flatMap((page) => page.items),
    total: first.total,
    message: first.message,
  }
}

export async function getTicket(id: number): Promise<Ticket> {
  const page = await listTickets({
    offset: 0,
    limit: 1,
    filters: { and: [{ column: 'id', op: 'eq', value: id }] },
  })
  const ticket = page.items[0]
  if (!ticket) throw new ApiError('Chamado não encontrado.', { status: 404, kind: 'not_found' })
  return ticket
}

export async function createTicket(body: {
  title: string
  description: string
  status: TicketStatus
}): Promise<Ticket> {
  const result = await apiRequest('/api/v2/tickets', { method: 'POST', body })
  try {
    return parseItem(ticketSchema, result.data, 'o chamado')
  } catch (error) {
    unexpected(error)
  }
}

export async function updateTicket(
  ticketId: number,
  body: { title: string; description: string; status?: TicketStatus },
): Promise<Ticket> {
  const result = await apiRequest(`/api/v2/tickets/${ticketId}`, { method: 'PUT', body })
  try {
    return parseItem(ticketSchema, result.data, 'o chamado')
  } catch (error) {
    unexpected(error)
  }
}

export async function deleteTicket(ticketId: number): Promise<void> {
  await apiRequest(`/api/v2/tickets/${ticketId}`, { method: 'DELETE' })
}

export async function listInteractions(params: InteractionListParams): Promise<Page<Interaction>> {
  const result = await apiRequest('/api/v2/ticket-interaction', {
    query: {
      offset: params.offset,
      limit: params.limit,
      id_ticket: params.id_ticket,
      filters: serializeFilters(params.filters),
    },
  })
  try {
    return asPage(parseList(interactionSchema, result.data, 'as mensagens'), result.total, result.message)
  } catch (error) {
    unexpected(error)
  }
}

export async function listThread(ticketId: number): Promise<{ items: Interaction[]; total: number }> {
  const first = await listInteractions({ offset: 0, limit: THREAD_PAGE, id_ticket: ticketId })
  const pages = Math.min(Math.ceil(first.total / THREAD_PAGE), THREAD_PAGE_CAP)
  const rest = await Promise.all(
    Array.from({ length: Math.max(pages - 1, 0) }, (_, index) =>
      listInteractions({ offset: (index + 1) * THREAD_PAGE, limit: THREAD_PAGE, id_ticket: ticketId }),
    ),
  )
  const items = [first, ...rest]
    .flatMap((page) => page.items)
    .sort((left, right) => new Date(left.created_at).getTime() - new Date(right.created_at).getTime())
  return { items, total: first.total }
}

export async function createInteraction(body: { text: string; id_ticket: number }): Promise<Interaction> {
  const result = await apiRequest('/api/v2/ticket-interaction', { method: 'POST', body })
  try {
    return parseItem(interactionSchema, result.data, 'a mensagem')
  } catch (error) {
    unexpected(error)
  }
}

export async function updateInteraction(interactionId: number, text: string): Promise<Interaction> {
  const result = await apiRequest(`/api/v2/ticket-interaction/${interactionId}`, {
    method: 'PUT',
    body: { text },
  })
  try {
    return parseItem(interactionSchema, result.data, 'a mensagem')
  } catch (error) {
    unexpected(error)
  }
}

export async function deleteInteraction(interactionId: number): Promise<void> {
  await apiRequest(`/api/v2/ticket-interaction/${interactionId}`, { method: 'DELETE' })
}
