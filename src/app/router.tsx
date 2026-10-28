import { Navigate, Outlet, useNavigate, type RouteObject } from 'react-router-dom'
import { useAuth } from '@/app/auth-context'
import { ErrorBlock, LoadingBlock } from '@/components/feedback/states'
import { isApiError } from '@/lib/api/errors'
import { errorMessage } from '@/lib/forms'
import { AppShell } from '@/components/layout/app-shell'
import { LoginPage } from '@/features/auth/login-page'
import { ProfilePage } from '@/features/profile/profile-page'
import { TicketCreatePage } from '@/features/tickets/ticket-create-page'
import { TicketDetailPage } from '@/features/tickets/ticket-detail-page'
import { TicketListPage } from '@/features/tickets/ticket-list-page'
import { UserCreatePage } from '@/features/users/user-create-page'
import { UserEditPage } from '@/features/users/user-edit-page'
import { UserListPage } from '@/features/users/user-list-page'

function RequireAuth() {
  const auth = useAuth()
  const navigate = useNavigate()
  if (auth.isLoading) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 pt-28">
        <LoadingBlock label="Confirmando sua sessão…" />
      </div>
    )
  }
  if (auth.sessionError && !(isApiError(auth.sessionError) && auth.sessionError.kind === 'unauthorized')) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 pt-28">
        <ErrorBlock message={errorMessage(auth.sessionError)} onRetry={() => void auth.retrySession()} />
        <button
          type="button"
          className="mt-4 text-sm text-mist"
          onClick={() => {
            auth.logout()
            navigate('/entrar', { replace: true })
          }}
        >
          Entrar com outra conta
        </button>
      </div>
    )
  }
  if (!auth.isAuthenticated) return <Navigate to="/entrar" replace />
  return <Outlet />
}

function RequireAdmin() {
  const { user } = useAuth()
  if (user?.role !== 'admin') {
    return (
      <div className="rise">
        <h1 className="font-display text-3xl break-words sm:text-5xl">Acesso restrito</h1>
        <p className="mt-4 max-w-md text-sm leading-6 text-mist">Esta área é restrita a administradores.</p>
      </div>
    )
  }
  return <Outlet />
}

function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-3xl flex-col justify-center px-4">
      <p className="text-[11px] tracking-[0.18em] text-mist uppercase">404</p>
      <h1 className="mt-3 font-display text-4xl break-words sm:text-6xl">Página não encontrada</h1>
      <div className="mt-8">
        <ButtonLinkHome />
      </div>
    </div>
  )
}

function ButtonLinkHome() {
  return (
    <a href="/" className="inline-flex rounded-lg bg-moss px-4 py-2.5 text-sm font-medium text-foam">
      Ir para os chamados
    </a>
  )
}

export const appRoutes: RouteObject[] = [
  { path: '/entrar', element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <TicketListPage /> },
          { path: 'chamados/novo', element: <TicketCreatePage /> },
          { path: 'chamados/:ticketId', element: <TicketDetailPage /> },
          { path: 'perfil', element: <ProfilePage /> },
          {
            element: <RequireAdmin />,
            children: [
              { path: 'usuarios', element: <UserListPage /> },
              { path: 'usuarios/novo', element: <UserCreatePage /> },
              { path: 'usuarios/:userId', element: <UserEditPage /> },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]
