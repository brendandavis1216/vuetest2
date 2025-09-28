import React, { useState, useEffect, createContext, useContext } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { showLoading, dismissToast, showError } from '@/utils/toast';

interface SessionContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        navigate('/login');
        dismissToast('auth-loading');
      } else if (currentSession) {
        setSession(currentSession);
        setUser(currentSession.user);
        if (location.pathname === '/login' || location.pathname === '/signup') {
          navigate('/');
        }
        dismissToast('auth-loading');
      } else {
        setSession(null);
        setUser(null);
        if (location.pathname !== '/login' && location.pathname !== '/signup') {
          navigate('/login');
        }
        dismissToast('auth-loading');
      }
      setLoading(false);
    });

    const getSession = async () => {
      setLoading(true);
      const toastId = showLoading("Checking authentication status...");
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      if (error) {
        showError(error.message);
        dismissToast(toastId);
        setLoading(false);
        return;
      }
      if (currentSession) {
        setSession(currentSession);
        setUser(currentSession.user);
        if (location.pathname === '/login' || location.pathname === '/signup') {
          navigate('/');
        }
      } else {
        setSession(null);
        setUser(null);
        if (location.pathname !== '/login' && location.pathname !== '/signup') {
          navigate('/login');
        }
      }
      dismissToast(toastId);
      setLoading(false);
    };

    getSession();

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <SessionContext.Provider value={{ session, user, loading }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionContextProvider');
  }
  return context;
};