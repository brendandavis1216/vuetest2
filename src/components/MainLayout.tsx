"use client";

import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useSupabase } from '@/integrations/supabase/SessionContextProvider';
import { showSuccess, showError } from '@/utils/toast';
import { Home, User } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { supabase } = useSupabase();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error.message);
      showError('Failed to sign out.');
    } else {
      showSuccess('Signed out successfully!');
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-primary text-primary-foreground p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/dashboard" className="text-2xl font-bold">
            My App
          </Link>
          <nav className="flex items-center space-x-4">
            <Link to="/dashboard">
              <Button variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10">
                <Home className="mr-2 h-4 w-4" /> Dashboard
              </Button>
            </Link>
            <Link to="/profile">
              <Button variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10">
                <User className="mr-2 h-4 w-4" /> Profile
              </Button>
            </Link>
            <Button onClick={handleSignOut} variant="secondary">
              Sign Out
            </Button>
          </nav>
        </div>
      </header>
      <main className="flex-grow container mx-auto p-4">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;