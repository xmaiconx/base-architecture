import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField, LoadingButton } from '@/components/forms';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';
import { APP_NAME } from '@/lib/constants';
import { useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';

/**
 * UpdatePasswordPage
 *
 * Password reset callback page. Users land here after clicking the magic link
 * from the password recovery email.
 *
 * Flow:
 * 1. User clicks magic link in email
 * 2. Supabase redirects to this page with session
 * 3. User enters new password
 * 4. Password is updated via Supabase Auth API
 * 5. User is redirected to dashboard
 */

const updatePasswordSchema = z
  .object({
    password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;

export function UpdatePasswordPage() {
  const navigate = useNavigate();
  const { updatePassword, session } = useSupabaseAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<UpdatePasswordInput>({
    resolver: zodResolver(updatePasswordSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  // Check if user has valid session (came from magic link)
  if (!session) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">{APP_NAME}</h1>
          <p className="text-muted-foreground">Redefinir senha</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Link inválido ou expirado</CardTitle>
            <CardDescription>O link de recuperação não é válido ou expirou</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Por favor, solicite um novo link de recuperação de senha.
            </p>
            <LoadingButton
              onClick={() => navigate('/auth/reset-password')}
              className="w-full"
            >
              Solicitar novo link
            </LoadingButton>
          </CardContent>
        </Card>
      </div>
    );
  }

  const onSubmit = async (data: UpdatePasswordInput) => {
    try {
      setIsSubmitting(true);
      await updatePassword({ password: data.password });
      toast.success('Senha alterada com sucesso!');

      // Redirect to dashboard
      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      console.error('Update password error:', error);
      const message = error.message || 'Erro ao alterar senha';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{APP_NAME}</h1>
        <p className="text-muted-foreground">Redefinir senha</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Criar nova senha</CardTitle>
          <CardDescription>Digite sua nova senha abaixo</CardDescription>
        </CardHeader>
        <CardContent>
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                name="password"
                label="Nova senha"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                description="Mínimo de 6 caracteres"
              />

              <FormField
                name="confirmPassword"
                label="Confirmar nova senha"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
              />

              <LoadingButton
                type="submit"
                className="w-full"
                loading={isSubmitting}
                loadingText="Salvando..."
              >
                Salvar nova senha
              </LoadingButton>
            </form>
          </FormProvider>
        </CardContent>
      </Card>
    </div>
  );
}
