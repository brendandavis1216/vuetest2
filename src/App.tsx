import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/Login";
import ProfilePage from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminEventDocuments from "./pages/AdminEventDocuments";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminCalendar from "./pages/AdminCalendar";
import AdminClientProfile from "./pages/AdminClientProfile";
import EventDetails from "./pages/EventDetails";
import MainLayout from "./components/MainLayout";
import { SessionContextProvider, useSupabase } from "./integrations/supabase/SessionContextProvider";
import React, { useEffect, useState, useCallback } from "react";

const queryClient = new QueryClient();

const AuthWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { supabase, session, loading } = useSupabase();
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingAdminStatus, setLoadingAdminStatus] = useState(true);

  const checkAdminStatus = useCallback(async () => {
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
  }, [session, supabase]);

  useEffect(() => {
    checkAdminStatus();
  }, [checkAdminStatus]);

  useEffect(() => {
    if (loading || loadingAdminStatus) return;

    const currentPath = location.pathname;

    if (session) {
      if (isAdmin) {
        if (currentPath === '/login' || currentPath === '/' || currentPath === '/dashboard') {
          navigate('/admin', { replace: true });
        }
      } else {
        if (currentPath === '/login' || currentPath === '/') {
          navigate('/dashboard', { replace: true });
        }
        // Allow access to specific admin paths for non-admins if they are explicitly linked,
        // but the pages themselves will handle permission checks.
        const allowedAdminPaths = ['/admin/event-documents', '/admin/analytics', '/admin/calendar', '/admin/clients'];
        const isAllowedAdminPath = allowedAdminPaths.some(path => currentPath.startsWith(path));

        if (currentPath.startsWith('/admin') && !isAllowedAdminPath) {
          navigate('/dashboard', { replace: true });
        }
      }
    } else {
      if (currentPath !== '/login' && currentPath !== '/') {
        navigate('/login', { replace: true });
      }
    }
  }, [session, loading, loadingAdminStatus, isAdmin, navigate, location.pathname]);

  if (loading || loadingAdminStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading application...</p>
      </div>
    );
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SessionContextProvider>
          <AuthWrapper>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<Index />} />
              
              <Route element={<MainLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/event-documents" element={<AdminEventDocuments />} />
                <Route path="/admin/analytics" element={<AdminAnalytics />} />
                <Route path="/admin/calendar" element={<AdminCalendar />} />
                <Route path="/admin/clients/:userId" element={<AdminClientProfile />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthWrapper>
        </SessionContextProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;