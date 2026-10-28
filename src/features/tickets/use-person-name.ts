import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/app/auth-context'
import { listAllUsers } from '@/lib/api/resources'

export function usePersonName(): (id: number) => string {
  const { user } = useAuth()
  const directory = useQuery({
    queryKey: ['users', 'directory'],
    queryFn: listAllUsers,
    enabled: user?.role === 'admin',
    staleTime: 60_000,
  })

  return (id: number) => {
    if (user?.id === id) return user.name
    return directory.data?.find((item) => item.id === id)?.name ?? `Usuário ${id}`
  }
}
