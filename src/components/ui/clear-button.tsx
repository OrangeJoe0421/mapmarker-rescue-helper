
import { Button, ButtonProps } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { useMapStore } from "@/store/useMapStore";
import { toast } from "sonner";

interface ClearButtonProps extends ButtonProps {
  onClear?: () => void;
}

export function ClearButton({ onClear, ...props }: ClearButtonProps) {
  const { clearAll, clearRoutes } = useMapStore();

  const handleClear = () => {
    if (window.confirm("Are you sure you want to clear all data and reset the application?")) {
      // First clear routes explicitly to ensure they're removed
      clearRoutes();
      console.log("Routes cleared from clear button");
      
      // Then clear everything else
      clearAll();
      
      if (onClear) onClear();
      toast.success("Application has been reset");
    }
  };

  return (
    <Button 
      variant="outline" 
      onClick={handleClear} 
      className="gap-2"
      {...props}
    >
      <RotateCcw className="h-4 w-4" />
      <span>Reset App</span>
    </Button>
  );
}
