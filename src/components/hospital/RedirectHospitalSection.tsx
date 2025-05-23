
import React from 'react';
import { EmergencyService } from '@/types/mapTypes';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Info } from 'lucide-react';

interface RedirectHospitalSectionProps {
  otherHospitals: EmergencyService[];
  selectedRedirectId: string | undefined;
  onChange: (hospitalId: string | undefined) => void;
}

export const RedirectHospitalSection: React.FC<RedirectHospitalSectionProps> = ({
  otherHospitals,
  selectedRedirectId,
  onChange
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <h4 className="font-medium">Redirect to Hospital</h4>
        <div className="bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded text-xs flex items-center">
          <Info className="h-3 w-3 mr-1" />
          Important
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        When this hospital doesn't have an emergency room, where should patients be redirected?
      </p>
      <Select
        value={selectedRedirectId || "none"}
        onValueChange={(value) => onChange(value === "none" ? undefined : value)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a hospital" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No redirection</SelectItem>
          {otherHospitals.map(hospital => (
            <SelectItem key={hospital.id} value={hospital.id}>
              {hospital.name}
              {hospital.distance !== undefined && ` (${hospital.distance.toFixed(1)} km)`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
