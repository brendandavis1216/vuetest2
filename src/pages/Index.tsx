import { MadeWithDyad } from "@/components/made-with-dyad";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
// import { Building } from "lucide-react"; // No longer needed if using an image

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="text-center mb-8">
        {/* Replace this with your company logo */}
        <img 
          src="/my-company-logo.png" // <--- IMPORTANT: Change this path to your actual logo file in the public folder
          alt="Your Company Logo" 
          className="mx-auto h-24 w-24 object-contain mb-4" // Adjust height, width, and styling as needed
        />
        <h1 className="text-4xl font-bold mb-4 text-foreground">Your Company Name</h1>
        <p className="text-xl text-foreground mb-6">
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