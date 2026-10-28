import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/app/auth-context'
import { PageIntro } from '@/components/layout/page-intro'
import { ButtonLink } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { OrderToggle } from '@/components/ui/order-toggle'
import { Pagination } from '@/components/ui/pagination'
import { Bezel } from '@/components/ui/surface'
import { StatusBadge } from '@/components/ui/status-badge'
import { EmptyBlock, ErrorBlock, LoadingBlock } from '@/components/feedback/states'
import { DeskPulse } from '@/features/tickets/desk-pulse'
import { TicketBoard } from '@/features/tickets/ticket-board'
import { labelName, matchesLabels, nextLabels, ticketLabels, ticketLabelsFor, useTicketLabels, type TicketLabel } from '@/features/tickets/labels'
import { matchingOwnerIds, nameMatches, ticketLookup } from '@/features/tickets/search'
import { TicketLabelToggles } from '@/features/tickets/ticket-label-toggles'
import { isTicketUnit, ticketUnits, unitCondition, type TicketUnit } from '@/features/tickets/units'
import { usePersonName } from '@/features/tickets/use-person-name'
import { listAllUsers, listTickets } from '@/lib/api/resources'
import type { FilterPayload, Ticket, TicketStatus } from '@/lib/api/types'
import { ticketStatuses } from '@/lib/api/types'
import { formatDateTime, statusLabel } from '@/lib/format'
import { errorMessage } from '@/lib/forms'
import { compareByDate, toggleOrder, type SortOrder } from '@/lib/order'
import { PAGE_SIZE } from '@/lib/pagination'

export function TicketListPage() {
  const { user } = useAuth()
  const personName = usePersonName()
  const [params, setParams] = useSearchParams()
  const view = params.get('vista') === 'lista' ? 'lista' : 'quadro'
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<TicketStatus | ''>('')
  const [unit, setUnit] = useState<TicketUnit | ''>('')
  const [labelFilter, setLabelFilter] = useState<TicketLabel[]>([])
  const [order, setOrder] = useState<SortOrder>('asc')
  const [page, setPage] = useState(0)
  const ticketTags = useTicketLabels()
  const timer = useRef(0)
  const directory = useQuery({
    queryKey: ['users', 'directory'],
    queryFn: listAllUsers,
    enabled: user?.role === 'admin',
    staleTime: 60_000,
  })

  useEffect(() => () => window.clearTimeout(timer.current), [])
  useEffect(() => {
    document.title = 'Chamados · PontoSat'
  }, [])

  const sharedFilters = useMemo<FilterPayload>(() => {
    const people = [...(directory.data ?? [])]
    if (user && !people.some((person) => person.id === user.id)) people.push(user)
    const lookup = ticketLookup(search, matchingOwnerIds(search, people))
    const and = [...(lookup.and ?? [])]
    if (unit) and.push(unitCondition(unit))
    return {
      and: and.length > 0 ? and : undefined,
      or: lookup.or,
    }
  }, [directory.data, search, unit, user])

  const listFilters = useMemo<FilterPayload>(() => {
    const and = [...(sharedFilters.and ?? [])]
    if (status) and.push({ column: 'status', op: 'eq', value: status })
    return {
      and: and.length > 0 ? and : undefined,
      or: sharedFilters.or,
    }
  }, [sharedFilters, status])

  const tickets = useQuery({
    queryKey: ['tickets', 'list', page, listFilters],
    queryFn: () => listTickets({ offset: page * PAGE_SIZE, limit: PAGE_SIZE, filters: listFilters }),
    placeholderData: keepPreviousData,
    enabled: view === 'lista',
  })
  function setView(next: 'quadro' | 'lista') {
    const copy = new URLSearchParams(params)
    if (next === 'quadro') copy.delete('vista')
    else copy.set('vista', 'lista')
    setParams(copy, { replace: true })
  }

  return (
    <>
      <DeskPulse />
      <PageIntro eyebrow="Atendimento" title="Chamados">
        <ButtonLink to="/chamados/novo" icon="plus">
          Novo chamado
        </ButtonLink>
      </PageIntro>
      <div className="mb-6 flex flex-col gap-4">
        <label className="sr-only" htmlFor="busca-chamados">
          Buscar chamados
        </label>
        <div className="flex items-center gap-3 rounded-lg border border-line bg-foam px-4 py-2.5">
          <Icon name="search" />
          <input
            id="busca-chamados"
            className="w-full bg-transparent text-sm outline-none placeholder:text-mist"
            placeholder="Número, nome ou trecho do chamado"
            value={searchInput}
            onChange={(event) => {
              const next = event.target.value
              setSearchInput(next)
              window.clearTimeout(timer.current)
              timer.current = window.setTimeout(() => {
                setSearch(next)
                setPage(0)
              }, 350)
            }}
          />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Vista dos chamados">
          <ViewButton active={view === 'quadro'} onClick={() => setView('quadro')}>
            Quadro
          </ViewButton>
          <ViewButton active={view === 'lista'} onClick={() => setView('lista')}>
            Lista
          </ViewButton>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="text-sm font-medium text-ink" htmlFor="filtro-unidade">
            Unidade
          </label>
          <select
            id="filtro-unidade"
            className="w-full rounded-lg border border-line bg-foam px-3.5 py-2.5 text-sm sm:w-auto"
            value={unit}
            onChange={(event) => {
              const next = event.target.value
              setUnit(isTicketUnit(next) ? next : '')
              setPage(0)
            }}
          >
            <option value="">Todas as unidades</option>
            {ticketUnits.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por status">
          <StatusChip
            active={status === ''}
            onClick={() => {
              setStatus('')
              setPage(0)
            }}
          >
            Todos
          </StatusChip>
          {ticketStatuses.map((item) => (
            <StatusChip
              key={item}
              active={status === item}
              onClick={() => {
                setStatus(item)
                setPage(0)
              }}
            >
              {statusLabel(item)}
            </StatusChip>
          ))}
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por etiqueta">
          {ticketLabels.map((label) => (
            <StatusChip
              key={label}
              active={labelFilter.includes(label)}
              onClick={() => setLabelFilter((current) => nextLabels(current, label))}
            >
              {labelName(label)}
            </StatusChip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-ink">Abertura</span>
          <OrderToggle order={order} onToggle={() => setOrder((current) => toggleOrder(current))} />
        </div>
        <p className="text-xs text-mist">As etiquetas ficam só neste navegador.</p>
      </div>
      {view === 'quadro' ? (
        <TicketBoard
          filters={sharedFilters}
          order={order}
          personName={personName}
          status={status}
          term={search}
          labels={ticketTags.labels}
          labelFilter={labelFilter}
          onToggleLabel={ticketTags.toggle}
        />
      ) : null}
      {view === 'lista' && tickets.isPending ? <LoadingBlock label="Carregando chamados…" /> : null}
      {view === 'lista' && tickets.isError ? (
        <ErrorBlock message={errorMessage(tickets.error)} onRetry={() => void tickets.refetch()} />
      ) : null}
      {view === 'lista' && tickets.data && tickets.data.items.length === 0 ? (
        <EmptyBlock title="Nenhum chamado aqui">Ajuste a busca ou abra uma solicitação nova.</EmptyBlock>
      ) : null}
      {view === 'lista' && tickets.data && tickets.data.items.length > 0 ? (
        <TicketList
          tickets={[...tickets.data.items]
            .sort((left, right) => compareByDate(left.date_created, right.date_created, order))
            .filter((ticket) => matchesLabels(ticketLabelsFor(ticket.status, ticketTags.labels[ticket.id]), labelFilter))}
          total={tickets.data.total}
          filtering={labelFilter.length > 0}
          page={page}
          personName={personName}
          search={search}
          labels={ticketTags.labels}
          onToggleLabel={ticketTags.toggle}
          onPage={setPage}
        />
      ) : null}
    </>
  )
}

function TicketList({
  tickets,
  total,
  filtering,
  page,
  personName,
  search,
  labels,
  onToggleLabel,
  onPage,
}: {
  tickets: Ticket[]
  total: number
  filtering: boolean
  page: number
  personName: (id: number) => string
  search: string
  labels: Record<number, TicketLabel[]>
  onToggleLabel: (id: number, label: TicketLabel) => void
  onPage: (page: number) => void
}) {
  if (tickets.length === 0) {
    return <EmptyBlock title="Nenhum chamado com essa etiqueta">Ela vale para os chamados carregados nesta página.</EmptyBlock>
  }
  return (
    <>
      <p className="mb-4 text-sm text-mist">{filtering ? `${tickets.length} chamados nesta página` : `${total} chamados`}</p>
      <Bezel>
        <ul>
          {tickets.map((ticket) => (
            <li key={ticket.id} className="border-b border-line px-4 py-5 last:border-b-0 sm:px-5">
              <Link to={`/chamados/${ticket.id}`} className="flex min-w-0 flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <StatusBadge status={ticket.status} />
                  <h2 className="mt-3 text-lg font-semibold break-words">{ticket.title}</h2>
                  <p className={`mt-2 text-sm break-words ${nameMatches(search, personName(ticket.id_user)) ? 'font-medium text-moss' : 'text-ink'}`}>
                    {personName(ticket.id_user)}
                  </p>
                  <p className="mt-2 line-clamp-2 max-w-2xl text-sm leading-6 break-words text-mist">{ticket.description}</p>
                </div>
                <div className="text-sm text-mist md:text-right">
                  <p>{formatDateTime(ticket.date_created)}</p>
                </div>
              </Link>
              {ticket.status !== 'closed' ? (
                <div className="mt-4">
                  <TicketLabelToggles ticketId={ticket.id} selected={labels[ticket.id] ?? []} onToggle={onToggleLabel} />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </Bezel>
      <Pagination page={page} total={total} limit={PAGE_SIZE} onPage={onPage} />
    </>
  )
}

function ViewButton({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={`rounded-lg px-4 py-2 text-sm font-medium ${active ? 'bg-moss text-foam' : 'bg-foam text-ink ring-1 ring-line'}`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function StatusChip({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={`rounded-lg px-4 py-2 text-sm ${active ? 'bg-moss text-foam' : 'bg-foam text-ink ring-1 ring-line'}`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
