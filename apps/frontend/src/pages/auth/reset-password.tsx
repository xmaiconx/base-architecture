import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField, LoadingButton } from '@/components/forms';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';
import { APP_NAME } from '@/lib/constants';
import { useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';

/**
 * ResetPasswordPage
 *
 * Allows users to request a password reset email via Supabase Auth.
 *
 * Flow:
 * 1. User enters email address
 * 2. Supabase sends magic link to email
 * 3. User clicks link and is redirected to /auth/update-password
 * 4. User enters new password on update-password page
 */

const resetPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordPage() {
  const { resetPassword } = useSupabaseAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    try {
      setIsSubmitting(true);
      await resetPassword(data);
      setEmailSent(true);
      toast.success('Email de recuperação enviado com sucesso!');
    } catch (error: any) {
      console.error('Reset password error:', error);
      const message = error.message || 'Erro ao enviar email de recuperação';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (emailSent) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">{APP_NAME}</h1>
          <p className="text-muted-foreground">Recuperação de senha</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Email enviado!</CardTitle>
            <CardDescription>Verifique sua caixa de entrada</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enviamos um email com instruções para redefinir sua senha. Clique no link do email
              para continuar.
            </p>
            <p className="text-sm text-muted-foreground">
              Não recebeu o email? Verifique sua pasta de spam ou tente novamente.
            </p>
            <div className="flex gap-2">
              <LoadingButton
                onClick={() => setEmailSent(false)}
                variant="outline"
                className="w-full"
              >
                Enviar novamente
              </LoadingButton>
              <Link to="/login" className="w-full">
                <LoadingButton variant="default" className="w-full">
                  Voltar para login
                </LoadingButton>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{APP_NAME}</h1>
        <p className="text-muted-foreground">Recuperação de senha</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Esqueceu sua senha?</CardTitle>
          <CardDescription>
            Digite seu email para receber um link de recuperação
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

              <LoadingButton
                type="submit"
                className="w-full"
                loading={isSubmitting}
                loadingText="Enviando..."
              >
                Enviar email de recuperação
              </LoadingButton>
            </form>
          </FormProvider>

          <div className="mt-4 text-center text-sm">
            <Link to="/login" className="text-primary hover:underline">
              Voltar para login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
