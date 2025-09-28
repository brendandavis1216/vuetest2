import { MadeWithDyad } from "@/components/made-with-dyad";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Index = () => {
  // The AuthWrapper now handles redirection for authenticated users.
  // This page will only be shown to unauthenticated users who land on '/'
  // before being redirected to '/login' by AuthWrapper.
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Welcome to Your App</h1>
        <p className="text-xl text-gray-600 mb-6">
          Please log in to continue.
        </p>
        <div className="flex space-x-4 justify-center">
          <Link to="/login">
            <Button>Login</Button>
          </Link>
        </div>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Index;