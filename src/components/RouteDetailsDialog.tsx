
import React from 'react';
import { Route, EmergencyService, RouteStep } from '@/types/mapTypes';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RouteDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  route: Route | null;
  service: EmergencyService | null;
}

const RouteDetailsDialog: React.FC<RouteDetailsDialogProps> = ({
  isOpen,
  onClose,
  route,
  service
}) => {
  if (!route || !service) return null;

  // Helper function to clean HTML instructions from Google Maps
  const cleanInstructions = (htmlInstructions: string): string => {
    return htmlInstructions
      // Extract content from between <b> tags for preservation
      .replace(/<b>(.*?)<\/b>/g, (_, streetName) => `"${streetName}"`)
      // Remove remaining HTML tags
      .replace(/<div.*?>/g, "")
      .replace(/<\/div>/g, "")
      .replace(/<\/?[^>]+(>|$)/g, "")
      // Clean up spaces and entities
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Route to {service.name}</DialogTitle>
        </DialogHeader>
        
        <div className="text-sm mb-4">
          <div><strong>Distance:</strong> {route.distance.toFixed(2)} km</div>
          {route.duration && (
            <div>
              <strong>Estimated travel time:</strong> {Math.floor(route.duration)} min {Math.round((route.duration % 1) * 60)} sec
            </div>
          )}
        </div>
        
        <ScrollArea className="h-[60vh]">
          {route.steps && route.steps.length > 0 ? (
            <Table>
              <TableCaption>Turn-by-turn directions to {service.name}</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Step</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead className="w-[100px] text-right">Distance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>1</TableCell>
                  <TableCell>Start at project location</TableCell>
                  <TableCell className="text-right">0.0 km</TableCell>
                </TableRow>
                
                {route.steps.map((step, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{idx + 2}</TableCell>
                    <TableCell>{cleanInstructions(step.instructions)}</TableCell>
                    <TableCell className="text-right">{(step.distance / 1000).toFixed(2)} km</TableCell>
                  </TableRow>
                ))}
                
                <TableRow>
                  <TableCell>{route.steps.length + 2}</TableCell>
                  <TableCell>Arrive at {service.name}</TableCell>
                  <TableCell className="text-right">0.0 km</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          ) : (
            <div className="text-center p-4 text-muted-foreground">
              No detailed directions available for this route.
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default RouteDetailsDialog;
