import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from '@tanstack/react-query'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { onUnauthorized } from '@/lib/api/client'
import { fetchMe, login as loginRequest } from '@/lib/api/resources'
import { clearSession, readSession, writeSession } from '@/lib/api/session'
import type { User } from '@/lib/api/types'

type AuthValue = {
  user: User | null
  hasSession: boolean
  isLoading: boolean
  isAuthenticated: boolean
  sessionError: unknown
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  retrySession: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [sessionVersion, setSessionVersion] = useState(0)
  const hasSession = readSession() !== null

  useEffect(
    () =>
      onUnauthorized(() => {
        clearSession()
        queryClient.clear()
        setSessionVersion((current) => current + 1)
      }),
    [queryClient],
  )

  const me = useQuery({
    queryKey: ['me', sessionVersion],
    queryFn: fetchMe,
    enabled: hasSession,
    retry: false,
    staleTime: 30_000,
  })

  const value: AuthValue = {
    user: me.data ?? null,
    hasSession,
    isLoading: hasSession && me.isPending,
    isAuthenticated: Boolean(me.data),
    sessionError: hasSession && me.isError ? me.error : null,
    login: async (email, password) => {
      const session = await loginRequest(email, password)
      writeSession(session.accessToken, session.expiresIn)
      setSessionVersion((current) => current + 1)
    },
    logout: () => {
      clearSession()
      queryClient.clear()
      setSessionVersion((current) => current + 1)
    },
    retrySession: async () => {
      await queryClient.invalidateQueries({ queryKey: ['me'] })
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth precisa estar dentro de AuthProvider.')
  return value
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
        staleTime: 10_000,
      },
      mutations: { retry: false },
    },
  })
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [client] = useState(() => createQueryClient())
  return (
    <QueryClientProvider client={client}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  )
}
