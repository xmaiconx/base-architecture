import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FormField, LoadingButton } from '@/components/forms'
import { useSupabaseAuth } from '@/hooks/use-supabase-auth'
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button'
import { signInSchema, type SignInInput } from '@/lib/validations'
import { APP_NAME } from '@/lib/constants'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn, loading } = useSupabaseAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: SignInInput) => {
    try {
      setIsSubmitting(true)
      await signIn(data)
      toast.success('Login realizado com sucesso!')

      // Redirect to the intended page or dashboard
      const from = location.state?.from?.pathname || '/dashboard'
      navigate(from, { replace: true })
    } catch (error: any) {
      console.error('Login error:', error)

      // Handle Supabase Auth errors
      const errorMessage = error.message || 'Erro ao fazer login'

      if (errorMessage.includes('Email not confirmed')) {
        navigate('/email-not-verified', {
          state: {
            email: data.email,
          },
        })
      } else if (errorMessage.includes('Invalid login credentials')) {
        toast.error('Email ou senha incorretos')
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show success message if redirected from signup
  useEffect(() => {
    if (location.state?.message) {
      toast.success(location.state.message)
    }
  }, [location.state])

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{APP_NAME}</h1>
        <p className="text-muted-foreground">
          Entre na sua conta para continuar
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Entrar</CardTitle>
          <CardDescription>
            Digite suas credenciais para acessar sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                autoComplete="current-password"
              />

              <LoadingButton
                type="submit"
                className="w-full"
                loading={isSubmitting}
                loadingText="Entrando..."
              >
                Entrar
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

          <div className="mt-4 text-center text-sm">
            <Link
              to="/auth/reset-password"
              className="text-primary hover:underline"
            >
              Esqueceu sua senha?
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="text-center text-sm">
        <span className="text-muted-foreground">Não tem uma conta? </span>
        <Link
          to="/signup"
          className="text-primary hover:underline font-medium"
        >
          Cadastre-se aqui
        </Link>
      </div>
    </div>
  )
}