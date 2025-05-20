
import React from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface EmergencyRoomStatusSectionProps {
  hasER: boolean | undefined;
  serviceId: string;
  onChange: (hasER: boolean) => void;
}

export const EmergencyRoomStatusSection: React.FC<EmergencyRoomStatusSectionProps> = ({
  hasER,
  serviceId,
  onChange
}) => {
  return (
    <div className="space-y-2">
      <h4 className="font-medium">Emergency Room Status</h4>
      <RadioGroup 
        value={hasER === true ? "yes" : hasER === false ? "no" : undefined}
        onValueChange={(value) => onChange(value === "yes")}
        className="space-y-1"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="yes" id={`details-er-yes-${serviceId}`} />
          <label htmlFor={`details-er-yes-${serviceId}`} className="text-sm">
            Yes, emergency room available
          </label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="no" id={`details-er-no-${serviceId}`} />
          <label htmlFor={`details-er-no-${serviceId}`} className="text-sm">
            No emergency room
          </label>
        </div>
      </RadioGroup>
    </div>
  );
};
