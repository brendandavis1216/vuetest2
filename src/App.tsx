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
import AdminEventDocuments from "./pages/AdminEventDocuments"; // Import the new AdminEventDocuments page
import EventDetails from "./pages/EventDetails";
import MainLayout from "./components/MainLayout";
import { SessionContextProvider, useSupabase } from "./integrations/supabase/SessionContextProvider";
import React, { useEffect } from "react";

const queryClient = new QueryClient();

// A wrapper component to handle authentication redirects
const AuthWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, loading } = useSupabase();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;

    const currentPath = location.pathname;

    if (session) {
      // If authenticated, redirect away from login/index pages to dashboard
      if (currentPath === '/login' || currentPath === '/') {
        navigate('/dashboard', { replace: true });
      }
    } else {
      // If unauthenticated, redirect to login page (unless already there)
      if (currentPath !== '/login') {
        navigate('/login', { replace: true });
      }
    }
  }, [session, loading, navigate, location.pathname]);

  if (loading) {
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
                <Route path="/admin/event-documents" element={<AdminEventDocuments />} /> {/* New Admin Event Documents route */}
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