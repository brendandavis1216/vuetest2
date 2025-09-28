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
import AdminAnalytics from "./pages/AdminAnalytics"; // Import the new AdminAnalytics page
import EventDetails from "./pages/EventDetails";
import MainLayout from "./components/MainLayout";
import { SessionContextProvider, useSupabase } from "./integrations/supabase/SessionContextProvider";
import React, { useEffect, useState, useCallback } from "react"; // Import useState and useCallback

const queryClient = new QueryClient();

// A wrapper component to handle authentication redirects
const AuthWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { supabase, session, loading } = useSupabase(); // Get supabase client
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
      // If authenticated
      if (isAdmin) {
        // Admins should go to /admin, redirect if they are on /login, /, or /dashboard
        if (currentPath === '/login' || currentPath === '/' || currentPath === '/dashboard') {
          navigate('/admin', { replace: true });
        }
      } else {
        // Non-admins should go to /dashboard, redirect if they are on /login or /
        if (currentPath === '/login' || currentPath === '/') {
          navigate('/dashboard', { replace: true });
        }
        // If a non-admin somehow lands on /admin or /admin/event-documents, redirect them to /dashboard
        if (currentPath.startsWith('/admin') && !currentPath.startsWith('/admin/event-documents') && !currentPath.startsWith('/admin/analytics')) {
          navigate('/dashboard', { replace: true });
        }
      }
    } else {
      // If unauthenticated, redirect to login page (unless already there)
      if (currentPath !== '/login' && currentPath !== '/') { // Also allow '/' as a public landing
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
              <Route path="/" element={<Index />} /> {/* Public landing page */}
              
              {/* Authenticated routes wrapped in MainLayout */}
              <Route element={<MainLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/event-documents" element={<AdminEventDocuments />} />
                <Route path="/admin/analytics" element={<AdminAnalytics />} /> {/* New Admin Analytics Route */}
                <Route path="/events/:id" element={<EventDetails />} />
              </Route>

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthWrapper>
        </SessionContextProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;