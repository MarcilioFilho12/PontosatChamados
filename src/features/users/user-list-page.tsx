import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '@/components/ui/icon'
import { OrderToggle } from '@/components/ui/order-toggle'
import { PageIntro } from '@/components/layout/page-intro'
import { ButtonLink } from '@/components/ui/button'
import { Pagination } from '@/components/ui/pagination'
import { Bezel } from '@/components/ui/surface'
import { EmptyBlock, ErrorBlock, LoadingBlock } from '@/components/feedback/states'
import { listUsers } from '@/lib/api/resources'
import type { Role } from '@/lib/api/types'
import { formatDateTime, roleLabel } from '@/lib/format'
import { errorMessage } from '@/lib/forms'
import { toggleOrder } from '@/lib/order'
import { PAGE_SIZE } from '@/lib/pagination'

export function UserListPage() {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [role, setRole] = useState<Role | ''>('')
  const [orderColumn, setOrderColumn] = useState<'name' | 'email' | 'createdAt'>('name')
  const [orderBy, setOrderBy] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(0)
  const timer = useRef(0)

  useEffect(() => () => window.clearTimeout(timer.current), [])
  useEffect(() => {
    document.title = 'Usuários · PontoSat'
  }, [])

  const users = useQuery({
    queryKey: ['users', 'list', page, search, role, orderColumn, orderBy],
    queryFn: () =>
      listUsers({
        offset: page * PAGE_SIZE,
        limit: PAGE_SIZE,
        search: search || undefined,
        role: role || undefined,
        orderColumn,
        orderBy,
      }),
    placeholderData: keepPreviousData,
  })

  function toggleSort(column: 'name' | 'email' | 'createdAt') {
    if (orderColumn === column) setOrderBy((current) => (current === 'asc' ? 'desc' : 'asc'))
    else {
      setOrderColumn(column)
      setOrderBy('asc')
    }
    setPage(0)
  }

  return (
    <>
      <PageIntro eyebrow="Administração" title="Usuários">
        <ButtonLink to="/usuarios/novo" icon="plus">
          Nova conta
        </ButtonLink>
      </PageIntro>
      <div className="mb-6 flex flex-col gap-3 md:flex-row">
        <label className="sr-only" htmlFor="busca-usuarios">
          Buscar usuários
        </label>
        <div className="flex w-full items-center gap-3 rounded-lg border border-line bg-foam px-4 py-2.5">
          <Icon name="search" />
          <input
            id="busca-usuarios"
            className="w-full bg-transparent text-sm outline-none placeholder:text-mist"
            placeholder="Buscar por nome ou e-mail"
            value={searchInput}
            onChange={(event) => {
              const next = event.target.value
              setSearchInput(next)
              window.clearTimeout(timer.current)
              timer.current = window.setTimeout(() => {
                setSearch(next.trim())
                setPage(0)
              }, 300)
            }}
          />
        </div>
        <select
          aria-label="Filtrar por perfil"
          className="w-full rounded-lg border border-line bg-foam px-3.5 py-2.5 text-sm md:w-auto"
          value={role}
          onChange={(event) => {
            setRole(event.target.value as Role | '')
            setPage(0)
          }}
        >
          <option value="">Todos os perfis</option>
          <option value="admin">Administrador</option>
          <option value="user">Usuário</option>
        </select>
        <select
          aria-label="Ordenar usuários"
          className="w-full rounded-lg border border-line bg-foam px-3.5 py-2.5 text-sm md:hidden"
          value={orderColumn}
          onChange={(event) => {
            setOrderColumn(event.target.value as 'name' | 'email' | 'createdAt')
            setPage(0)
          }}
        >
          <option value="name">Nome</option>
          <option value="email">E-mail</option>
          <option value="createdAt">Data de criação</option>
        </select>
        <OrderToggle
          order={orderBy}
          onToggle={() => {
            setOrderBy((current) => toggleOrder(current))
            setPage(0)
          }}
        />
      </div>
      {users.isPending ? <LoadingBlock label="Carregando usuários…" /> : null}
      {users.isError ? <ErrorBlock message={errorMessage(users.error)} onRetry={() => void users.refetch()} /> : null}
      {users.data && users.data.items.length === 0 ? (
        <EmptyBlock title="Nenhuma conta encontrada">Tente outro termo ou crie uma conta nova.</EmptyBlock>
      ) : null}
      {users.data && users.data.items.length > 0 ? (
        <>
          <Bezel>
            <ul className="md:hidden">
              {users.data.items.map((user) => (
                <li key={user.id} className="border-b border-line last:border-b-0">
                  <Link to={`/usuarios/${user.id}`} className="block px-4 py-4">
                    <p className="font-medium break-words">
                      <Mark text={user.name} term={search} />
                    </p>
                    <p className="mt-1 text-sm break-all text-mist">
                      <Mark text={user.email} term={search} />
                    </p>
                    <p className="mt-2 text-xs text-mist">
                      {roleLabel(user.role)} · {formatDateTime(user.createdAt)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[40rem] text-left text-sm">
                <thead className="text-mist">
                  <tr>
                    <th className="px-5 py-4 font-medium">
                      <SortButton label="Nome" active={orderColumn === 'name'} direction={orderBy} onClick={() => toggleSort('name')} />
                    </th>
                    <th className="px-5 py-4 font-medium">
                      <SortButton label="E-mail" active={orderColumn === 'email'} direction={orderBy} onClick={() => toggleSort('email')} />
                    </th>
                    <th className="px-5 py-4 font-medium">Perfil</th>
                    <th className="px-5 py-4 font-medium">
                      <SortButton label="Criado em" active={orderColumn === 'createdAt'} direction={orderBy} onClick={() => toggleSort('createdAt')} />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.data.items.map((user) => (
                    <tr key={user.id} className="border-t border-line">
                      <td className="px-5 py-4">
                        <Link to={`/usuarios/${user.id}`} className="font-medium">
                          <Mark text={user.name} term={search} />
                        </Link>
                      </td>
                      <td className="px-5 py-4">
                        <Mark text={user.email} term={search} />
                      </td>
                      <td className="px-5 py-4">{roleLabel(user.role)}</td>
                      <td className="px-5 py-4">{formatDateTime(user.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Bezel>
          <Pagination page={page} total={users.data.total} limit={PAGE_SIZE} onPage={setPage} />
        </>
      ) : null}
    </>
  )
}

function Mark({ text, term }: { text: string; term: string }) {
  const needle = term.trim()
  const index = needle.length > 0 ? text.toLocaleLowerCase().indexOf(needle.toLocaleLowerCase()) : -1
  if (index < 0) return text
  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded bg-brand-soft px-0.5 text-moss">{text.slice(index, index + needle.length)}</mark>
      {text.slice(index + needle.length)}
    </>
  )
}

function SortButton({
  label,
  active,
  direction,
  onClick,
}: {
  label: string
  active: boolean
  direction: 'asc' | 'desc'
  onClick: () => void
}) {
  const suffix = active ? (direction === 'asc' ? ', crescente' : ', decrescente') : ''
  return (
    <button type="button" className="underline-offset-4 hover:underline" aria-label={`Ordenar por ${label}${suffix}`} onClick={onClick}>
      {label}
      {active ? (direction === 'asc' ? ' ↑' : ' ↓') : ''}
    </button>
  )
}
