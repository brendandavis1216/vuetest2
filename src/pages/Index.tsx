import { useSession } from "@/components/SessionContextProvider";
import DashboardLayout from "@/components/DashboardLayout"; // Import the new layout component

const Index = () => {
  const { user, loading } = useSession();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <p className="text-xl">Loading application...</p>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center h-full p-4">
        <h1 className="text-4xl font-bold mb-4">Welcome, {user?.email}!</h1>
        <p className="text-xl text-gray-400 mb-6">
          This is your VUE Production Dashboard.
        </p>
        <p className="text-lg text-gray-500">
          Use the sidebar to navigate.
        </p>
      </div>
    </DashboardLayout>
  );
};

export default Index;