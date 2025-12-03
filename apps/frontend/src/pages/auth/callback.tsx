import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

/**
 * AuthCallbackPage
 *
 * OAuth callback handler for Supabase Auth.
 * Handles redirects from Google OAuth and email confirmation links.
 *
 * Flow:
 * 1. User authenticates via OAuth or clicks email confirmation link
 * 2. Supabase redirects to this page with session in URL hash
 * 3. Supabase SDK automatically extracts and stores session
 * 4. Redirect user to dashboard or intended destination
 *
 * Note: The session is automatically handled by Supabase SDK via
 * detectSessionInUrl: true config in supabase client.
 */
export function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the current session (Supabase SDK handles URL parsing automatically)
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth callback error:', error);
          toast.error('Erro ao processar autenticação');
          navigate('/login', { replace: true });
          return;
        }

        if (session) {
          // Success! Supabase SDK already stored the session.
          // The useSupabaseAuth hook will detect the session change
          // and sync with the application auth store automatically.
          toast.success('Autenticado com sucesso!');
          navigate('/dashboard', { replace: true });
        } else {
          // No session found in URL
          toast.error('Link inválido ou expirado');
          navigate('/login', { replace: true });
        }
      } catch (error) {
        console.error('Unexpected error in auth callback:', error);
        toast.error('Erro inesperado. Tente novamente.');
        navigate('/login', { replace: true });
      }
    };

    handleCallback();
  }, [navigate]);

  // Show loading state while processing callback
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        <p className="text-muted-foreground">Processando autenticação...</p>
      </div>
    </div>
  );
}
