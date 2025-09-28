"use client";

import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useSupabase } from '@/integrations/supabase/SessionContextProvider';

const LoginPage = () => {
  const { supabase } = useSupabase();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
          Sign in to your account
        </h2>
        <Auth
          supabaseClient={supabase}
          providers={[]} // No third-party providers by default
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: 'hsl(var(--primary))',
                  brandAccent: 'hsl(var(--primary-foreground))',
                },
              },
            },
          }}
          theme="light"
          // Removed redirectTo prop to allow AuthWrapper to handle navigation
          extraFields={[
            {
              name: 'school',
              label: 'School',
              type: 'text',
              required: true,
              placeholder: 'Enter your school',
            },
            {
              name: 'fraternity',
              label: 'Fraternity',
              type: 'text',
              required: true,
              placeholder: 'Enter your fraternity',
            },
          ]}
        />
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Administrators: Use your designated admin credentials above.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;