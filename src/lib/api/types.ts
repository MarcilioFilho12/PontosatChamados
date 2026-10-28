export const roles = ['admin', 'user'] as const
export const ticketStatuses = ['open', 'in_progress', 'closed'] as const

export type Role = (typeof roles)[number]
export type TicketStatus = (typeof ticketStatuses)[number]

export type User = {
  id: number
  uuid: string
  name: string
  email: string
  role: Role
  createdAt: string
  updatedAt: string
}

export type Ticket = {
  id: number
  uuid: string
  title: string
  description: string
  status: TicketStatus
  id_user: number
  date_created: string
  date_updated: string
}

export type Interaction = {
  id: number
  uuid: string
  text: string
  id_user: number
  id_ticket: number
  created_at: string
  updated_at: string
}

export type FilterOption = {
  value: string
  name: string
}

export type FilterField = {
  value: string
  name: string
  type: string
  default: boolean
  operators: string[]
  options: FilterOption[]
}

export type PageMeta = {
  total: number
}

export type Page<T> = {
  items: T[]
  total: number
  message: string
}

export type FilterValue = string | number | Array<string | number>

export type FilterCondition = {
  column: string
  op: string
  value: FilterValue
}

export type FilterPayload = {
  and?: FilterCondition[]
  or?: FilterCondition[]
}

export type UserListParams = {
  offset: number
  limit: number
  search?: string
  role?: Role
  orderColumn?: 'id' | 'name' | 'email' | 'createdAt'
  orderBy?: 'asc' | 'desc'
  filters?: FilterPayload
}

export type TicketListParams = {
  offset: number
  limit: number
  filters?: FilterPayload
}

export type InteractionListParams = {
  offset: number
  limit: number
  id_ticket?: number
  filters?: FilterPayload
}
