import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/app/auth-context'
import { Button } from '@/components/ui/button'
import { Field, TextInput } from '@/components/ui/field'
import { Bezel } from '@/components/ui/surface'
import { FormAlert } from '@/components/feedback/states'
import { isApiError } from '@/lib/api/errors'
import { applyApiErrors } from '@/lib/forms'
import { LoginEdgeArt } from '@/features/auth/edge-hero'
import { LoginDotField } from '@/features/auth/login-dots'
import { loginFormSchema, type LoginFormValues } from '@/lib/validation/schemas'

export function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', password: '' },
  })

  if (isAuthenticated) {
    const from = (location.state as { from?: string } | null)?.from ?? '/'
    return <Navigate to={from} replace />
  }

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-black">
      <LoginDotField />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.75)_0%,rgba(0,0,0,0)_100%)]"
      />
      <div className="relative z-10 mx-auto grid min-h-[100dvh] w-full max-w-6xl items-center gap-8 px-4 py-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)] lg:gap-12 lg:px-8">
      <section className="rise min-w-0">
        <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-ink uppercase shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
          <span className="h-1.5 w-1.5 rounded-full bg-moss" aria-hidden="true" />
          PontoSat
        </p>
        <h1 className="mt-5 whitespace-nowrap font-hero text-[clamp(1.15rem,2.15vw,2.05rem)] leading-none font-semibold tracking-[-0.03em] text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.95),0_0_16px_rgba(0,0,0,0.9)]">
          O chamado deixa de se perder.
        </h1>
        <p className="mt-4 max-w-md text-[15px] leading-6 font-medium text-white sm:text-base sm:leading-7 [text-shadow:0_1px_2px_rgba(0,0,0,0.95),0_0_14px_rgba(0,0,0,0.85)]">
          Abra uma solicitação, acompanhe o status e mantenha a conversa no mesmo lugar.
        </p>
        <LoginEdgeArt className="[--illos-ink:#f4f7fb] [--illos-line:#c5ced9]" />
      </section>
      <Bezel className="text-ink">
        <form
          className="flex flex-col gap-5 px-5 py-7 sm:px-6 lg:px-8"
          noValidate
          onSubmit={form.handleSubmit(async (values) => {
            setFormError(null)
            try {
              await login(values.email, values.password)
              navigate('/', { replace: true })
            } catch (error) {
              if (isApiError(error) && (error.kind === 'unauthorized' || error.kind === 'forbidden')) {
                setFormError('E-mail ou senha inválidos.')
                return
              }
              applyApiErrors(error, form.setError, setFormError)
            }
          })}
        >
          <h2 className="font-display text-3xl sm:text-4xl">Entrar</h2>
          <FormAlert message={formError} />
          <Field label="E-mail" htmlFor="email" error={form.formState.errors.email?.message}>
            <TextInput
              id="email"
              type="email"
              autoComplete="username"
              invalid={Boolean(form.formState.errors.email)}
              {...form.register('email')}
            />
          </Field>
          <Field label="Senha" htmlFor="password" error={form.formState.errors.password?.message}>
            <TextInput
              id="password"
              type="password"
              autoComplete="current-password"
              invalid={Boolean(form.formState.errors.password)}
              {...form.register('password')}
            />
          </Field>
          <Button type="submit" icon="arrow" disabled={form.formState.isSubmitting || isLoading}>
            {form.formState.isSubmitting ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>
      </Bezel>
      </div>
    </div>
  )
}
