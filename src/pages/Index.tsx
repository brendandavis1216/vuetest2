import { MadeWithDyad } from "@/components/made-with-dyad";
import { Link } from "react-router-dom"; // Import Link for navigation
import { Button } from "@/components/ui/button"; // Import Button for styling

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Welcome to Your App</h1>
        <p className="text-xl text-gray-600 mb-6">
          You are logged in! Explore your profile or start building.
        </p>
        <Link to="/profile">
          <Button>Go to Profile</Button>
        </Link>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Index;