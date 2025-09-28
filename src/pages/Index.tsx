import { MadeWithDyad } from "@/components/made-with-dyad";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Building } from "lucide-react"; // Import a placeholder icon

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="text-center mb-8">
        {/* Placeholder for your company logo */}
        <Building className="mx-auto h-24 w-24 text-primary mb-4" /> 
        <h1 className="text-4xl font-bold mb-4 text-foreground">Your Company Name</h1> {/* You can change this text */}
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