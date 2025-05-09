
import { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useToast } from "./ui/use-toast";

// Custom WizardIcon SVG component
const WizardIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className="h-5 w-5"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Wizard hat */}
    <path 
      d="M12 2L8 10H16L12 2Z" 
      fill="currentColor" 
      stroke="currentColor"
    />
    
    {/* Wizard face/beard */}
    <path 
      d="M8 10C8 10 7 12 7 14C7 17 9 19 12 19C15 19 17 17 17 14C17 12 16 10 16 10" 
      fill="none"
    />
    
    {/* Eyes */}
    <circle cx="10" cy="12" r="0.5" fill="currentColor" />
    <circle cx="14" cy="12" r="0.5" fill="currentColor" />
    
    {/* Robe bottom */}
    <path 
      d="M9 19L7 23M15 19L17 23" 
      stroke="currentColor"
      strokeWidth="1.5"
    />
    
    {/* Magic sparkles */}
    <path 
      d="M20 4L21 5M4 4L3 5M5 9L3 8M19 9L21 8" 
      stroke="currentColor"
      strokeWidth="1.5"
    />
  </svg>
);

const CORRECT_PASSWORD = "Ragnar";

interface PasswordGateProps {
  onCorrectPassword: () => void;
  displayFullScreen?: boolean;
  title?: string;
}

const PasswordGate = ({ 
  onCorrectPassword, 
  displayFullScreen = true,
  title = "Emergency Response Planner" 
}: PasswordGateProps) => {
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === CORRECT_PASSWORD) {
      onCorrectPassword();
      localStorage.setItem("auth", "true");
    } else {
      toast({
        variant: "destructive",
        title: "Incorrect Password",
        description: "Please try again",
      });
      setPassword("");
    }
  };

  if (!displayFullScreen) {
    return (
      <div className="space-y-4 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
        <div className="text-center">
          <div className="flex justify-center mb-2">
            <div className="h-10 w-10 bg-purple-500/20 rounded-full flex items-center justify-center">
              <WizardIcon />
            </div>
          </div>
          <h2 className="text-xl font-bold text-purple-100">Developer Access Required</h2>
          <p className="mt-2 text-slate-400">Enter password to continue</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="text-center bg-slate-700/50 border-slate-600 text-slate-200"
            autoFocus
          />
          <Button 
            type="submit" 
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          >
            Continue
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-background/80 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <img 
            src="/lovable-uploads/e7fb8cc8-9b48-457c-a65f-7ed272d81060.png" 
            alt="Stantec Logo" 
            className="mx-auto h-16"
          />
          <h2 className="mt-6 text-2xl font-bold">{title}</h2>
          <p className="mt-2 text-muted-foreground">Enter password to continue</p>
        </div>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="text-center"
            autoFocus
          />
          <Button type="submit" className="w-full">
            Continue
          </Button>
        </form>
      </div>
    </div>
  );
};

export default PasswordGate;
