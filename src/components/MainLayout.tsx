"use client";

import React, { useEffect, useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useSupabase } from '@/integrations/supabase/SessionContextProvider';
import { showSuccess, showError } from '@/utils/toast';
import { Home, User, Shield, BarChart, CalendarDays } from 'lucide-react'; // Added CalendarDays icon
import { useEventNotifications } from '@/hooks/useEventNotifications'; // Import the new hook

const MainLayout: React.FC = () => {
  const { supabase, session } = useSupabase();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  // Activate the event notifications hook
  useEventNotifications();

  useEffect(() => {
    const checkAdmin = async () => {
      if (session?.user) {
        const { data, error } = await supabase.rpc('is_admin');
        if (error) {
          console.error('Error checking admin role:', error.message);
          setIsAdmin(false);
        } else {
          setIsAdmin(data);
        }
      } else {
        setIsAdmin(false);
      }
    };
    checkAdmin();
  }, [session, supabase]);

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
          <Link to={isAdmin ? "/admin" : "/dashboard"} className="text-2xl font-bold">
            VUE
          </Link>
          <nav className="flex items-center space-x-4">
            {!isAdmin && ( // Only show Dashboard link if not an admin
              <Link to="/dashboard">
                <Button variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10">
                  <Home className="mr-2 h-4 w-4" /> Dashboard
                </Button>
              </Link>
            )}
            <Link to="/profile">
              <Button variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10">
                <User className="mr-2 h-4 w-4" /> Profile
              </Button>
            </Link>
            {isAdmin && (
              <>
                <Link to="/admin">
                  <Button variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10">
                    <Shield className="mr-2 h-4 w-4" /> Admin
                  </Button>
                </Link>
                <Link to="/admin/analytics">
                  <Button variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10">
                    <BarChart className="mr-2 h-4 w-4" /> Analytics
                  </Button>
                </Link>
                <Link to="/admin/calendar"> {/* New Calendar link */}
                  <Button variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10">
                    <CalendarDays className="mr-2 h-4 w-4" /> Calendar
                  </Button>
                </Link>
              </>
            )}
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