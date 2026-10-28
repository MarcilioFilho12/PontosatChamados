import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import {
  canMove,
  columnFromKey,
  longestWaitingId,
  moveTargets,
  relocatePage,
  statusChangeBody,
} from '@/features/tickets/board'
import { matchesLabels, ticketLabelsFor, type TicketLabel } from '@/features/tickets/labels'
import { nameMatches } from '@/features/tickets/search'
import { TicketLabelToggles } from '@/features/tickets/ticket-label-toggles'
import { listColumnTickets, updateTicket } from '@/lib/api/resources'
import type { FilterPayload, Page, Ticket, TicketStatus } from '@/lib/api/types'
import { ticketStatuses } from '@/lib/api/types'
import { formatDateTime, statusLabel } from '@/lib/format'
import { errorMessage } from '@/lib/forms'
import { compareByDate, type SortOrder } from '@/lib/order'
import { PAGE_SIZE } from '@/lib/pagination'
import { Button } from '@/components/ui/button'

const columnTone: Record<TicketStatus, string> = {
  open: 'bg-warning-ink text-white',
  in_progress: 'bg-brand-soft text-moss',
  closed: 'bg-success-soft text-success-ink',
}

const cardAccent: Record<TicketStatus, string> = {
  open: 'border-l-warning-ink',
  in_progress: 'border-l-moss',
  closed: 'border-l-success-ink',
}

const numberTone: Record<TicketStatus, string> = {
  open: 'text-warning-ink',
  in_progress: 'text-moss',
  closed: 'text-success-ink',
}

export function TicketBoard({
  filters,
  order,
  personName,
  status,
  term = '',
  labels,
  labelFilter,
  onToggleLabel,
}: {
  filters: FilterPayload
  order: SortOrder
  personName: (id: number) => string
  status?: TicketStatus | ''
  term?: string
  labels: Record<number, TicketLabel[]>
  labelFilter: TicketLabel[]
  onToggleLabel: (id: number, label: TicketLabel) => void
}) {
  const queryClient = useQueryClient()
  const dragging = useRef<Ticket | null>(null)
  const generation = useRef(0)
  const sentGeneration = useRef(0)
  const [over, setOver] = useState<TicketStatus | null>(null)
  const [pendingMove, setPendingMove] = useState<{ ticket: Ticket; to: TicketStatus } | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const move = useMutation({
    mutationFn: ({ ticket, to }: { ticket: Ticket; to: TicketStatus }) => {
      const body = statusChangeBody(ticket, to)
      if (!body) return Promise.reject(new Error('O chamado não pode ser movido.'))
      return updateTicket(ticket.id, body)
    },
    onSuccess: (_updated, { ticket, to }) => {
      if (generation.current !== sentGeneration.current) return
      const snapshots = queryClient.getQueriesData<Page<Ticket>>({ queryKey: ['tickets', 'board'] })
      for (const [key, page] of snapshots) {
        const column = columnFromKey(key)
        if (!page || !column) continue
        queryClient.setQueryData(key, relocatePage(page, column, ticket, to))
      }
      setPendingMove(null)
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tickets'] })
    },
  })
  function clearDrag() {
    dragging.current = null
    setOver(null)
  }

  function closePanel() {
    generation.current += 1
    setPendingMove(null)
    move.reset()
  }

  function requestMove(ticket: Ticket, to: TicketStatus) {
    if (move.isPending || pendingMove) return
    if (!canMove(ticket.status, to)) {
      const targets = moveTargets(ticket.status)
      setNotice(
        targets.length > 0
          ? `O chamado #${ticket.id} pode ir para ${targets.map((item) => statusLabel(item)).join(' ou ')}.`
          : `O chamado #${ticket.id} já está finalizado.`,
      )
      return
    }
    if (!statusChangeBody(ticket, to)) {
      setNotice(`O chamado #${ticket.id} precisa de título e descrição para mudar de estado.`)
      return
    }
    setNotice(null)
    move.reset()
    setPendingMove({ ticket, to })
  }

  function confirmMove() {
    if (!pendingMove || move.isPending) return
    sentGeneration.current = generation.current
    move.mutate(pendingMove)
  }

  return (
    <div>
      {notice ? (
        <p role="status" className="mb-4 rounded-lg bg-paper px-4 py-3 text-sm text-ink ring-1 ring-line">
          {notice}
        </p>
      ) : null}
      <div className="flex min-w-0 snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-4 lg:snap-none">
        {(status ? ticketStatuses.filter((item) => item === status) : ticketStatuses)
          .filter((item) => labelFilter.length === 0 || item !== 'closed' || status === 'closed')
          .map((column) => (
          <Column
            key={`${column}:${JSON.stringify(filters)}`}
            status={column}
            filters={filters}
            order={order}
            solo={Boolean(status)}
            personName={personName}
            term={term}
            labels={labels}
            labelFilter={labelFilter}
            onToggleLabel={onToggleLabel}
            active={over === column}
            moving={move.isPending}
            onMove={requestMove}
            onDragStart={(ticket) => {
              dragging.current = ticket
            }}
            onDragEnd={clearDrag}
            onDragOver={() => {
              const ticket = dragging.current
              setOver(ticket && canMove(ticket.status, column) ? column : null)
            }}
            onDrop={() => {
              const ticket = dragging.current
              clearDrag()
              if (ticket) requestMove(ticket, column)
            }}
          />
        ))}
      </div>
      <MovePanel
        pending={pendingMove}
        sending={move.isPending}
        failure={move.isError ? errorMessage(move.error) : null}
        onConfirm={confirmMove}
        onClose={closePanel}
      />
    </div>
  )
}

function OwnerName({ name, term }: { name: string; term: string }) {
  if (!nameMatches(term, name)) return <p className="text-sm break-words text-mist">{name}</p>
  return <p className="text-sm font-medium break-words text-moss">{name}</p>
}

function Column({
  status,
  filters,
  order,
  personName,
  solo,
  term,
  labels,
  labelFilter,
  onToggleLabel,
  active,
  moving,
  onMove,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: {
  status: TicketStatus
  filters: FilterPayload
  order: SortOrder
  personName: (id: number) => string
  solo: boolean
  term: string
  labels: Record<number, TicketLabel[]>
  labelFilter: TicketLabel[]
  onToggleLabel: (id: number, label: TicketLabel) => void
  active: boolean
  moving: boolean
  onMove: (ticket: Ticket, to: TicketStatus) => void
  onDragStart: (ticket: Ticket) => void
  onDragEnd: () => void
  onDragOver: () => void
  onDrop: () => void
}) {
  const [shown, setShown] = useState(PAGE_SIZE)
  const headingId = `coluna-${status}`
  const columnFilters = useMemo<FilterPayload>(
    () => ({
      and: [...(filters.and ?? []), { column: 'status', op: 'eq', value: status }],
      or: filters.or,
    }),
    [filters, status],
  )

  const tickets = useQuery({
    queryKey: ['tickets', 'board', status, columnFilters],
    queryFn: () => listColumnTickets(columnFilters),
    placeholderData: keepPreviousData,
  })
  const waitingId = status === 'open' && tickets.data ? longestWaitingId(tickets.data.items) : null
  const ordered = (tickets.data?.items ?? [])
    .filter((ticket) => status === 'closed' || matchesLabels(ticketLabelsFor(ticket.status, labels[ticket.id]), labelFilter))
    .sort((left, right) => compareByDate(left.date_created, right.date_created, order))
  const visible = ordered.slice(0, shown)
  const count = tickets.data ? (labelFilter.length > 0 ? ordered.length : tickets.data.total) : null

  function allowDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault()
    onDragOver()
  }

  return (
    <section
      aria-labelledby={headingId}
      className={`flex flex-col rounded-xl border bg-paper ${
        solo
          ? 'w-full min-w-0'
          : 'w-[min(20rem,calc(100%-2rem))] shrink-0 snap-start lg:w-auto lg:min-w-0 lg:flex-1 lg:shrink'
      } ${
        active ? 'border-moss' : 'border-line'
      }`}
      onDragOver={allowDrop}
      onDrop={(event) => {
        event.preventDefault()
        onDrop()
      }}
    >
      <h2
        id={headingId}
        aria-label={`${statusLabel(status)}: ${count ?? '…'}`}
        className={`flex items-center justify-between rounded-t-xl px-4 py-3 text-sm font-semibold ${columnTone[status]}`}
      >
        <span>{statusLabel(status)}</span>
        <span className="tabular-nums">{count ?? '…'}</span>
      </h2>
      <div className="flex min-h-48 flex-col gap-3 p-3">
        {tickets.isPending ? <p className="text-sm text-mist">Carregando…</p> : null}
        {tickets.isError ? (
          <div role="alert">
            <p className="text-sm text-clay">{errorMessage(tickets.error)}</p>
            <button type="button" className="mt-2 text-sm font-medium text-moss" onClick={() => void tickets.refetch()}>
              Tentar de novo
            </button>
          </div>
        ) : null}
        {tickets.data && tickets.data.items.length === 0 ? <p className="text-sm text-mist">Nenhum chamado</p> : null}
        {tickets.data && tickets.data.items.length > 0 && visible.length === 0 ? (
          <p className="text-sm text-mist">Nenhum chamado com essa etiqueta</p>
        ) : null}
        {visible.map((ticket) => {
          const targets = moveTargets(ticket.status)
          return (
            <article
              key={ticket.id}
              draggable={targets.length > 0 && !moving}
              onDragStart={(event) => {
                const origin = event.target
                if (origin instanceof Element && origin.closest('a, select, button, label')) {
                  event.preventDefault()
                  return
                }
                if (event.dataTransfer) {
                  event.dataTransfer.effectAllowed = 'move'
                  event.dataTransfer.setData('text/plain', String(ticket.id))
                }
                onDragStart(ticket)
              }}
              onDragEnd={onDragEnd}
              className={`rounded-xl border border-line border-l-4 bg-foam p-4 shadow-card ${cardAccent[ticket.status]} ${
                targets.length > 0 ? 'cursor-grab active:cursor-grabbing' : ''
              }`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <p className={`text-lg font-semibold tabular-nums ${numberTone[ticket.status]}`}>#{ticket.id}</p>
                <OwnerName name={personName(ticket.id_user)} term={term} />
              </div>
              {ticket.id === waitingId ? (
                <p className="mt-1 text-xs font-medium text-warning-ink">Há mais tempo em aberto</p>
              ) : null}
              <Link to={`/chamados/${ticket.id}`} className="mt-2 block font-medium break-words text-ink">
                {ticket.title}
              </Link>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-mist">{ticket.description}</p>
              <time className="mt-3 block text-xs text-mist" dateTime={ticket.date_created}>
                {formatDateTime(ticket.date_created)}
              </time>
              {ticket.status !== 'closed' ? (
                <div className="mt-3">
                  <TicketLabelToggles ticketId={ticket.id} selected={labels[ticket.id] ?? []} onToggle={onToggleLabel} />
                </div>
              ) : null}
              {targets.length > 0 ? (
                <label className="mt-3 block text-xs font-medium text-mist" htmlFor={`mover-${ticket.id}`}>
                  Mover para
                  <select
                    id={`mover-${ticket.id}`}
                    aria-label={`Mover ${ticket.title}`}
                    className="mt-1 w-full rounded-lg border border-line bg-foam px-3 py-2 text-sm text-ink"
                    value={ticket.status}
                    disabled={moving}
                    onChange={(event) => onMove(ticket, event.target.value as TicketStatus)}
                  >
                    <option value={ticket.status}>{statusLabel(ticket.status)}</option>
                    {targets.map((target) => (
                      <option key={target} value={target}>
                        {statusLabel(target)}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <p className="mt-3 text-xs text-mist">Sem próxima etapa</p>
              )}
            </article>
          )
        })}
        {ordered.length > shown ? (
          <button
            type="button"
            className="rounded-lg border border-line bg-foam px-3 py-2 text-sm text-ink"
            onClick={() => setShown((current) => current + PAGE_SIZE)}
          >
            Carregar mais
          </button>
        ) : null}
      </div>
    </section>
  )
}

function MovePanel({
  pending,
  sending,
  failure,
  onConfirm,
  onClose,
}: {
  pending: { ticket: Ticket; to: TicketStatus } | null
  sending: boolean
  failure: string | null
  onConfirm: () => void
  onClose: () => void
}) {
  useEffect(() => {
    if (!pending) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose, pending])

  if (!pending) return null

  const attending = pending.to === 'in_progress' || pending.ticket.status === 'in_progress'
  const title = attending ? 'Em atendimento' : statusLabel(pending.to)

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="painel-movimento"
        className={`flex max-h-[min(40rem,calc(100dvh-2rem))] w-full flex-col rounded-2xl bg-foam shadow-card ${
          attending ? 'max-w-3xl' : 'max-w-xl'
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="shrink-0 px-5 pt-6 sm:px-6 md:px-10 md:pt-10">
          <p className={`font-semibold tabular-nums ${attending ? 'text-2xl text-moss sm:text-3xl' : 'text-2xl text-ink'}`}>
            #{pending.ticket.id}
          </p>
          <h2 id="painel-movimento" className={`mt-2 font-semibold tracking-tight break-words text-ink ${attending ? 'text-3xl sm:text-4xl' : 'text-2xl'}`}>
            {title}
          </h2>
          <p className="mt-4 text-sm text-mist">
            {statusLabel(pending.ticket.status)} para {statusLabel(pending.to)}
          </p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-6 md:px-10">
          <p className="text-lg font-medium break-words text-ink">{pending.ticket.title}</p>
          <p className="mt-3 text-sm leading-7 break-words whitespace-pre-wrap text-mist">{pending.ticket.description}</p>
          {failure ? (
            <p role="alert" className="mt-6 rounded-lg bg-danger-soft px-4 py-3 text-sm text-clay">
              {failure} O chamado #{pending.ticket.id} permanece em {statusLabel(pending.ticket.status)}.
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-3 border-t border-line px-5 py-4 sm:px-6 md:px-10">
          <Button type="button" variant="quiet" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" disabled={sending} onClick={onConfirm}>
            {sending ? 'Movendo…' : 'Confirmar'}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
