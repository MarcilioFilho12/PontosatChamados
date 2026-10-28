import type { Role, TicketStatus } from '@/lib/api/types'

const statusLabels: Record<TicketStatus, string> = {
  open: 'Aberto',
  in_progress: 'Em atendimento',
  closed: 'Finalizado',
}

const roleLabels: Record<Role, string> = {
  admin: 'Administrador',
  user: 'Usuário',
}

export function statusLabel(status: TicketStatus): string {
  return statusLabels[status]
}

export function roleLabel(role: Role): string {
  return roleLabels[role]
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'Data indisponível'
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(date)
}

export function userLabel(name: string | undefined, id: number): string {
  if (name && name.trim().length > 0) return name
  return `Usuário ${id}`
}
