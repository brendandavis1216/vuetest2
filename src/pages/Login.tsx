import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { MadeWithDyad } from '@/components/made-with-dyad';

const Login = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4">
      <div className="w-full max-w-md bg-gray-900 p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center mb-6 text-white">VUE Production</h1>
        <Auth
          supabaseClient={supabase}
          providers={[]} // No third-party providers for a professional app unless specified
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: 'hsl(var(--primary))', // Using primary color from tailwind config
                  brandAccent: 'hsl(var(--primary-foreground))', // Using primary-foreground
                  defaultButtonBackground: 'hsl(var(--secondary))',
                  defaultButtonBackgroundHover: 'hsl(var(--secondary-foreground))',
                  inputBackground: 'hsl(var(--background))',
                  inputBorder: 'hsl(var(--border))',
                  inputBorderHover: 'hsl(var(--ring))',
                  inputBorderFocus: 'hsl(var(--ring))',
                  inputText: 'hsl(var(--foreground))',
                  inputLabelText: 'hsl(var(--foreground))',
                  anchorText: 'hsl(var(--primary))',
                  anchorTextHover: 'hsl(var(--primary-foreground))',
                  messageText: 'hsl(var(--foreground))',
                },
                radii: {
                  borderRadiusButton: 'var(--radius)',
                  buttonBorderRadius: 'var(--radius)',
                  inputBorderRadius: 'var(--radius)',
                },
              },
            },
          }}
          theme="dark" // Using dark theme for black background
          redirectTo={window.location.origin}
        />
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Login;