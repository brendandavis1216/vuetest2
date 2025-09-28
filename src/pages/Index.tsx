import { MadeWithDyad } from "@/components/made-with-dyad";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useSupabase } from "@/integrations/supabase/SessionContextProvider"; // Import useSupabase
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const { session } = useSupabase();
  const navigate = useNavigate();

  // Redirect to profile if logged in and on the index page
  useEffect(() => {
    if (session) {
      navigate('/profile');
    }
  }, [session, navigate]);

  // This page should ideally not be reached by authenticated users anymore
  // but if it is, it will redirect them.
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Welcome to Your App</h1>
        <p className="text-xl text-gray-600 mb-6">
          Please log in to continue.
        </p>
        <Link to="/login">
          <Button>Go to Login</Button>
        </Link>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Index;