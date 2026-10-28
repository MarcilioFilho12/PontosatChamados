import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/app/auth-context'
import { Button } from '@/components/ui/button'
import { Field, SelectInput, TextInput } from '@/components/ui/field'
import { Bezel, ConfirmDialog } from '@/components/ui/surface'
import { ErrorBlock, FormAlert, LoadingBlock, StatusNote } from '@/components/feedback/states'
import { deleteUser, getUser, updateUser } from '@/lib/api/resources'
import { applyApiErrors, errorMessage } from '@/lib/forms'
import { updateUserFormSchema, type UpdateUserFormValues } from '@/lib/validation/schemas'

export function UserEditPage() {
  const params = useParams()
  const userId = Number(params.userId)
  const valid = Number.isInteger(userId) && userId >= 1
  const user = useQuery({
    queryKey: ['users', 'one', userId],
    queryFn: () => getUser(userId),
    enabled: valid,
  })

  if (!valid) return <ErrorBlock message="Usuário não encontrado." />
  if (user.isPending) return <LoadingBlock label="Carregando conta…" />
  if (user.isError) return <ErrorBlock message={errorMessage(user.error)} onRetry={() => void user.refetch()} />

  return <UserEditor userId={user.data.id} name={user.data.name} role={user.data.role} email={user.data.email} />
}

function UserEditor({
  userId,
  name,
  role,
  email,
}: {
  userId: number
  name: string
  role: 'admin' | 'user'
  email: string
}) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [formError, setFormError] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const form = useForm<UpdateUserFormValues>({
    resolver: zodResolver(updateUserFormSchema),
    defaultValues: { name, role, password: '' },
  })
  const save = useMutation({
    mutationFn: (values: UpdateUserFormValues) =>
      updateUser(userId, {
        name: values.name,
        role: values.role,
        ...(values.password.trim() ? { password: values.password } : {}),
      }),
    onSuccess: async () => {
      setNote('Conta atualizada.')
      form.setValue('password', '')
      await queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
  const remove = useMutation({
    mutationFn: () => deleteUser(userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] })
      navigate('/usuarios', { replace: true })
    },
  })
  const isSelf = user?.id === userId

  return (
    <>
      <Link to="/usuarios" className="text-sm text-mist">
        Voltar
      </Link>
      <h1 className="mt-4 font-display text-3xl break-words sm:text-5xl">{name}</h1>
      <p className="mt-2 text-sm break-all text-mist">{email}</p>
      <p className="mt-1 text-sm text-mist">O e-mail não pode ser alterado.</p>
      <div className="mt-8">
        <Bezel>
          <form
            className="flex flex-col gap-5 px-6 py-7"
            noValidate
            onSubmit={form.handleSubmit(async (values) => {
              setFormError(null)
              setNote(null)
              try {
                await save.mutateAsync(values)
              } catch (error) {
                applyApiErrors(error, form.setError, setFormError)
              }
            })}
          >
            <FormAlert message={formError} />
            <StatusNote message={note} />
            <Field label="Nome" htmlFor="name" error={form.formState.errors.name?.message}>
              <TextInput id="name" maxLength={150} invalid={Boolean(form.formState.errors.name)} {...form.register('name')} />
            </Field>
            <Field label="Perfil" htmlFor="role" error={form.formState.errors.role?.message}>
              <SelectInput id="role" invalid={Boolean(form.formState.errors.role)} {...form.register('role')}>
                <option value="user">Usuário</option>
                <option value="admin">Administrador</option>
              </SelectInput>
            </Field>
            <Field label="Nova senha" htmlFor="password" hint="Deixe em branco para manter a senha atual.">
              <TextInput id="password" type="password" autoComplete="new-password" {...form.register('password')} />
            </Field>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Salvando…' : 'Salvar conta'}
            </Button>
          </form>
        </Bezel>
      </div>
      <div className="mt-6">
        {isSelf ? (
          <p className="text-sm text-mist">A sessão atual não pode ser excluída por aqui.</p>
        ) : (
          <Button type="button" variant="danger" onClick={() => setConfirmDelete(true)}>
            Excluir conta
          </Button>
        )}
      </div>
      <ConfirmDialog
        open={confirmDelete}
        title="Excluir conta?"
        description="A pessoa deixa de entrar no sistema."
        confirmLabel="Excluir conta"
        pending={remove.isPending}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => remove.mutate()}
      />
      {remove.isError ? <p className="mt-3 text-sm text-clay">{errorMessage(remove.error)}</p> : null}
    </>
  )
}
