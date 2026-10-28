import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Field, SelectInput, TextInput } from '@/components/ui/field'
import { Bezel } from '@/components/ui/surface'
import { FormAlert } from '@/components/feedback/states'
import { PageIntro } from '@/components/layout/page-intro'
import { createUser } from '@/lib/api/resources'
import { applyApiErrors } from '@/lib/forms'
import { createUserFormSchema, type CreateUserFormValues } from '@/lib/validation/schemas'

export function UserCreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserFormSchema),
    defaultValues: { name: '', email: '', password: '', role: 'user' },
  })
  const mutation = useMutation({
    mutationFn: createUser,
    onSuccess: async (user) => {
      await queryClient.invalidateQueries({ queryKey: ['users'] })
      navigate(`/usuarios/${user.id}`)
    },
  })

  return (
    <>
      <PageIntro eyebrow="Nova conta" title="Criar usuário">
        <Link to="/usuarios" className="text-sm text-mist">
          Voltar
        </Link>
      </PageIntro>
      <Bezel>
        <form
          className="flex flex-col gap-5 px-6 py-7"
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
          <FormAlert message={formError} />
          <Field label="Nome" htmlFor="name" error={form.formState.errors.name?.message}>
            <TextInput id="name" maxLength={150} invalid={Boolean(form.formState.errors.name)} {...form.register('name')} />
          </Field>
          <Field
            label="E-mail"
            htmlFor="email"
            error={form.formState.errors.email?.message}
            hint="Obrigatório para criar a conta."
          >
            <TextInput
              id="email"
              type="email"
              autoComplete="off"
              required
              aria-required="true"
              invalid={Boolean(form.formState.errors.email)}
              {...form.register('email')}
            />
          </Field>
          <Field label="Senha" htmlFor="password" error={form.formState.errors.password?.message}>
            <TextInput id="password" type="password" autoComplete="new-password" invalid={Boolean(form.formState.errors.password)} {...form.register('password')} />
          </Field>
          <Field label="Perfil" htmlFor="role" error={form.formState.errors.role?.message}>
            <SelectInput id="role" invalid={Boolean(form.formState.errors.role)} {...form.register('role')}>
              <option value="user">Usuário</option>
              <option value="admin">Administrador</option>
            </SelectInput>
          </Field>
          <Button type="submit" icon="plus" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Criando…' : 'Criar conta'}
          </Button>
        </form>
      </Bezel>
    </>
  )
}
