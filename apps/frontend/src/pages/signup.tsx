import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FormField, LoadingButton } from '@/components/forms'
import { useSupabaseAuth } from '@/hooks/use-supabase-auth'
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button'
import { signUpSchema, type SignUpInput } from '@/lib/validations'
import { APP_NAME } from '@/lib/constants'
import { useState } from 'react'
import { toast } from 'sonner'

export function SignUpPage() {
  const navigate = useNavigate()
  const { signUp } = useSupabaseAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (data: SignUpInput) => {
    try {
      setIsSubmitting(true)
      await signUp({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
      })
      toast.success('Conta criada com sucesso!')

      // Redirect to signup success page
      navigate('/signup/success', {
        state: {
          email: data.email,
        },
      })
    } catch (error: any) {
      console.error('Signup error:', error)
      const message = error.message || 'Erro ao criar conta'

      if (message.includes('already registered')) {
        toast.error('Este email já está cadastrado')
      } else {
        toast.error(message)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{APP_NAME}</h1>
        <p className="text-muted-foreground">
          Crie sua conta para começar
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Criar Conta</CardTitle>
          <CardDescription>
            Preencha os dados abaixo para criar sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <FormField
                name="fullName"
                label="Nome completo"
                type="text"
                placeholder="Seu nome completo"
                autoComplete="name"
              />

              <FormField
                name="email"
                label="Email"
                type="email"
                placeholder="seu@email.com"
                autoComplete="email"
              />

              <FormField
                name="password"
                label="Senha"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                description="Mínimo de 6 caracteres"
              />

              <FormField
                name="confirmPassword"
                label="Confirmar senha"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
              />

              <LoadingButton
                type="submit"
                className="w-full"
                loading={isSubmitting}
                loadingText="Criando conta..."
              >
                Criar Conta
              </LoadingButton>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Ou continue com
                  </span>
                </div>
              </div>

              <GoogleSignInButton fullWidth disabled={isSubmitting} />
            </form>
          </FormProvider>
        </CardContent>
      </Card>

      <div className="text-center text-sm">
        <span className="text-muted-foreground">Já tem uma conta? </span>
        <Link
          to="/login"
          className="text-primary hover:underline font-medium"
        >
          Entre aqui
        </Link>
      </div>
    </div>
  )
}