import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { useAuth } from '@/app/auth-context'
import { FormAlert, StatusNote } from '@/components/feedback/states'
import { PageIntro } from '@/components/layout/page-intro'
import { Button } from '@/components/ui/button'
import { Field, TextInput } from '@/components/ui/field'
import { Bezel } from '@/components/ui/surface'
import { listTickets, updateProfile } from '@/lib/api/resources'
import { readSession } from '@/lib/api/session'
import type { Role, TicketStatus, User } from '@/lib/api/types'
import { ticketStatuses } from '@/lib/api/types'
import { formatDateTime, roleLabel, statusLabel } from '@/lib/format'
import { applyApiErrors, errorMessage } from '@/lib/forms'
import { profileFormSchema, type ProfileFormValues } from '@/lib/validation/schemas'

const roleNote: Record<Role, string> = {
  admin: 'Vê a fila inteira, acompanha qualquer chamado e cadastra quem usa o atendimento.',
  user: 'Abre chamados, acompanha os que são desta conta e responde na conversa.',
}

export function ProfilePage() {
  const { user } = useAuth()
  const [editing, setEditing] = useState(false)
  const [note, setNote] = useState<string | null>(null)

  useEffect(() => {
    document.title = 'Perfil · PontoSat'
  }, [])

  return (
    <>
      <PageIntro eyebrow="Sua conta" title="Perfil">
        {user ? (
          <Button type="button" variant={editing ? 'quiet' : 'primary'} onClick={() => setEditing((current) => !current)}>
            {editing ? 'Fechar edição' : 'Editar perfil'}
          </Button>
        ) : null}
      </PageIntro>
      <StatusNote message={note} />
      {user ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(16rem,0.7fr)]">
          <ProfileFacts user={user} />
          <OwnQueue userId={user.id} />
        </div>
      ) : null}
      {user && editing ? (
        <div className="mt-6">
          <ProfileEditor
            user={user}
            onSaved={() => {
              setNote('Perfil atualizado.')
              setEditing(false)
            }}
          />
        </div>
      ) : null}
    </>
  )
}

function ProfileFacts({ user }: { user: User }) {
  const session = readSession()
  const facts = [
    { label: 'E-mail', value: user.email, hint: 'Identifica o acesso e não muda nesta tela.' },
    { label: 'Função', value: roleLabel(user.role) },
    { label: 'Conta criada', value: formatDateTime(user.createdAt) },
    { label: 'Cadastro atualizado', value: formatDateTime(user.updatedAt) },
    ...(session
      ? [{ label: 'Sessão deste navegador', value: `Até ${formatDateTime(new Date(session.expiresAt).toISOString())}` }]
      : []),
  ]

  return (
    <Bezel>
      <div className="px-6 py-7">
        <p className="text-[11px] font-medium tracking-[0.18em] text-mist uppercase">Identificação</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight break-words text-ink">{user.name}</h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-ink">{roleNote[user.role]}</p>
        <dl className="mt-6 grid gap-5 sm:grid-cols-2">
          {facts.map((fact) => (
            <div key={fact.label}>
              <dt className="text-sm text-mist">{fact.label}</dt>
              <dd className="mt-1 text-sm font-medium break-words text-ink">{fact.value}</dd>
              {fact.hint ? <dd className="mt-1 text-xs leading-5 text-mist">{fact.hint}</dd> : null}
            </div>
          ))}
        </dl>
      </div>
    </Bezel>
  )
}

function OwnQueue({ userId }: { userId: number }) {
  const counts = useQueries({
    queries: ticketStatuses.map((status) => ({
      queryKey: ['tickets', 'own-count', userId, status],
      queryFn: () =>
        listTickets({
          offset: 0,
          limit: 1,
          filters: {
            and: [
              { column: 'id_user', op: 'eq', value: userId },
              { column: 'status', op: 'eq', value: status },
            ],
          },
        }),
    })),
  })
  const failed = counts.find((query) => query.isError)

  return (
    <Bezel>
      <div className="flex h-full flex-col px-6 py-7">
        <p className="text-[11px] font-medium tracking-[0.18em] text-mist uppercase">Fila desta conta</p>
        <p className="mt-3 text-sm leading-6 text-mist">Chamados que esta conta abriu.</p>
        {failed ? (
          <div className="mt-5" role="alert">
            <p className="text-sm text-clay">{errorMessage(failed.error)}</p>
            <button type="button" className="mt-2 text-sm font-medium text-moss" onClick={() => void failed.refetch()}>
              Tentar de novo
            </button>
          </div>
        ) : (
          <ul className="mt-5 flex flex-col gap-3">
            {ticketStatuses.map((status, index) => (
              <QueueCount key={status} status={status} total={counts[index]?.data?.total} pending={counts[index]?.isPending} />
            ))}
          </ul>
        )}
        <Link to="/" className="mt-6 text-sm font-medium text-moss">
          Abrir o quadro
        </Link>
      </div>
    </Bezel>
  )
}

function QueueCount({ status, total, pending }: { status: TicketStatus; total: number | undefined; pending: boolean | undefined }) {
  return (
    <li className="flex items-baseline justify-between gap-4 rounded-lg bg-paper px-4 py-3">
      <span className="text-sm text-ink">{statusLabel(status)}</span>
      <span className="text-2xl font-semibold tabular-nums text-ink">{pending || total === undefined ? '…' : total}</span>
    </li>
  )
}

function ProfileEditor({ user, onSaved }: { user: User; onSaved: () => void }) {
  const queryClient = useQueryClient()
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user.name,
      currentPassword: '',
      password: '',
      passwordConfirmation: '',
    },
  })

  const mutation = useMutation({
    mutationFn: (values: ProfileFormValues) =>
      updateProfile({
        name: values.name,
        currentPassword: values.currentPassword,
        ...(values.password
          ? { password: values.password, passwordConfirmation: values.passwordConfirmation }
          : {}),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['me'] })
      onSaved()
    },
  })

  return (
      <Bezel>
        <form
          className="flex max-w-xl flex-col gap-5 px-6 py-7"
          noValidate
          onSubmit={form.handleSubmit(async (values) => {
            setFormError(null)
            try {
              await mutation.mutateAsync(values)
            } catch (error) {
              applyApiErrors(error, form.setError, setFormError)
            }
          })}
        >
        <div>
          <h2 className="text-lg font-semibold text-ink">Editar perfil</h2>
          <p className="mt-2 text-sm leading-6 text-mist">Dá para mudar o nome e, se quiser, a senha. O e-mail permanece o mesmo.</p>
        </div>
          <FormAlert message={formError} />
          <Field label="Nome" htmlFor="name" error={form.formState.errors.name?.message}>
            <TextInput id="name" maxLength={150} invalid={Boolean(form.formState.errors.name)} {...form.register('name')} />
          </Field>
          <Field
            label="Senha atual"
            htmlFor="currentPassword"
            error={form.formState.errors.currentPassword?.message}
            hint="Obrigatória mesmo quando só o nome muda."
          >
            <TextInput
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              invalid={Boolean(form.formState.errors.currentPassword)}
              {...form.register('currentPassword')}
            />
          </Field>
          <Field label="Nova senha" htmlFor="password" error={form.formState.errors.password?.message}>
            <TextInput id="password" type="password" autoComplete="new-password" {...form.register('password')} />
          </Field>
          <Field
            label="Confirmação da senha"
            htmlFor="passwordConfirmation"
            error={form.formState.errors.passwordConfirmation?.message}
          >
            <TextInput
              id="passwordConfirmation"
              type="password"
              autoComplete="new-password"
              invalid={Boolean(form.formState.errors.passwordConfirmation)}
              {...form.register('passwordConfirmation')}
            />
          </Field>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Salvando…' : 'Salvar perfil'}
          </Button>
        </form>
      </Bezel>
  )
}
