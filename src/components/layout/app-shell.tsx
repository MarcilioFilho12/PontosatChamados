import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/app/auth-context'
import { Icon } from '@/components/ui/icon'
import { roleLabel } from '@/lib/format'

type NavIcon = 'tickets' | 'users' | 'profile'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
    isActive
      ? 'bg-brand-soft text-moss shadow-[inset_2px_0_0_0_var(--color-moss)]'
      : 'text-mist hover:bg-paper hover:text-ink'
  }`

function initials(name: string | undefined): string {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? []
  const letters = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '')
  const mark = letters.join('')
  return mark.length > 0 ? mark : 'PS'
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-moss text-sm font-semibold text-foam">P</span>
      <span>
        <span className="block text-sm font-semibold leading-5 text-ink">PontoSat</span>
        <span className="block text-xs leading-4 text-mist">Atendimento</span>
      </span>
    </div>
  )
}

function NavList({
  items,
  onNavigate,
}: {
  items: { to: string; label: string; end: boolean; icon: NavIcon }[]
  onNavigate?: () => void
}) {
  return (
    <nav className="flex flex-col gap-1" aria-label="Principal">
      {items.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.end} className={linkClass} onClick={onNavigate}>
          <Icon name={item.icon} />
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}

export function AppShell() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const wide = pathname === '/'
  const items: { to: string; label: string; end: boolean; icon: NavIcon }[] = [
    { to: '/', label: 'Chamados', end: true, icon: 'tickets' },
    ...(user?.role === 'admin' ? [{ to: '/usuarios', label: 'Usuários', end: false, icon: 'users' as const }] : []),
    { to: '/perfil', label: 'Perfil', end: false, icon: 'profile' },
  ]

  function leave() {
    logout()
    navigate('/entrar', { replace: true })
  }

  function closeAndLeave() {
    setOpen(false)
    leave()
  }

  return (
    <div className="min-h-[100dvh] md:grid md:grid-cols-[16.25rem_minmax(0,1fr)]">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-foam focus:px-4 focus:py-2"
      >
        Pular para o conteúdo
      </a>
      <aside className="hidden border-r border-line bg-foam md:sticky md:top-0 md:flex md:h-[100dvh] md:flex-col">
        <div className="px-4 py-5">
          <Brand />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3">
          <NavList items={items} />
        </div>
        <Account name={user?.name} role={user ? roleLabel(user.role) : ''} onLeave={leave} />
      </aside>
      <div className="flex min-w-0 flex-col">
        <header
          className="sticky top-0 z-40 flex items-center justify-between border-b border-line bg-foam/95 px-4 py-3 backdrop-blur md:hidden"
          inert={open || undefined}
        >
          <Brand />
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-lg text-ink hover:bg-paper"
            aria-expanded={open}
            aria-controls="menu-mobile"
            aria-label="Abrir menu"
            onClick={() => setOpen(true)}
          >
            <Icon name="menu" />
          </button>
        </header>
        {open ? (
          <div id="menu-mobile" className="fixed inset-0 z-50 flex md:hidden">
            <div className="flex h-full w-[min(18rem,85%)] flex-col bg-foam shadow-card">
              <div className="flex items-center justify-between px-4 py-4">
                <Brand />
                <button
                  type="button"
                  className="grid h-10 w-10 place-items-center rounded-lg text-ink hover:bg-paper"
                  aria-label="Fechar menu"
                  onClick={() => setOpen(false)}
                >
                  <Icon name="close" />
              </button>
              </div>
              <div className="px-3">
                <NavList items={items} onNavigate={() => setOpen(false)} />
              </div>
              <Account name={user?.name} role={user ? roleLabel(user.role) : ''} onLeave={closeAndLeave} />
            </div>
            <button type="button" className="min-w-0 flex-1 bg-ink/40" aria-label="Fechar menu" onClick={() => setOpen(false)} />
          </div>
        ) : null}
        <main id="conteudo" className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className={wide ? 'rise' : 'rise mx-auto w-full max-w-5xl'}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

function Account({ name, role, onLeave }: { name?: string; role: string; onLeave: () => void }) {
  return (
    <div className="mt-auto border-t border-line p-3">
      <div className="flex items-center gap-3 px-2 py-2">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-semibold text-moss">
          {initials(name)}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-ink">{name}</span>
          <span className="block truncate text-xs text-mist">{role}</span>
        </span>
      </div>
      <button
        type="button"
        className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-mist hover:bg-paper hover:text-ink"
        onClick={onLeave}
      >
        <Icon name="logout" />
        Sair
      </button>
    </div>
  )
}
