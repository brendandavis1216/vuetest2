import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/Login";
import ProfilePage from "./pages/Profile"; // Import the new ProfilePage
import { SessionContextProvider, useSupabase } from "./integrations/supabase/SessionContextProvider";
import React, { useEffect } from "react";

const queryClient = new QueryClient();

// A wrapper component to handle authentication redirects
const AuthWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, loading } = useSupabase();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session && window.location.pathname !== '/login') {
      navigate('/login');
    }
  }, [session, loading, navigate]);

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
              <Route path="/profile" element={<ProfilePage />} /> {/* Add the profile route */}
              <Route path="/" element={<Index />} />
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