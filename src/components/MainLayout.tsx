"use client";

import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useSupabase } from '@/integrations/supabase/SessionContextProvider';
import { showSuccess, showError } from '@/utils/toast';
import { useEventNotifications } from '@/hooks/useEventNotifications';
import SidebarLayout from './SidebarLayout'; // Import the new SidebarLayout

const MainLayout: React.FC = () => {
  const { supabase, session } = useSupabase();
  const navigate = useNavigate();
  const location = useLocation(); // Get current location for active link highlighting
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingAdminStatus, setLoadingAdminStatus] = useState(true);

  // Activate the event notifications hook
  useEventNotifications();

  useEffect(() => {
    const checkAdmin = async () => {
      setLoadingAdminStatus(true);
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
      setLoadingAdminStatus(false);
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

  if (loadingAdminStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading user permissions...</p>
      </div>
    );
  }

  return (
    <SidebarLayout isAdmin={isAdmin} onSignOut={handleSignOut}>
      <Outlet />
    </SidebarLayout>
  );
};

export default MainLayout;