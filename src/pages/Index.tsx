import { MadeWithDyad } from "@/components/made-with-dyad";
import { useSession } from "@/components/SessionContextProvider";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";

const Index = () => {
  const { user, loading } = useSession();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      showError(error.message);
    } else {
      showSuccess("Logged out successfully!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <p className="text-xl">Loading application...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome, {user?.email}!</h1>
        <p className="text-xl text-gray-400 mb-6">
          This is your VUE Production Dashboard.
        </p>
        <Button onClick={handleLogout} variant="secondary" className="bg-gray-800 hover:bg-gray-700 text-white">
          Logout
        </Button>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Index;