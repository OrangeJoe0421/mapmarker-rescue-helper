
import React from 'react';
import { EmergencyService } from '@/types/mapTypes';

interface EmergencyRoomVerificationProps {
  service: EmergencyService | string;
  hasER?: boolean;
}

// This component has been disabled as part of removing verification functionality
const EmergencyRoomVerification: React.FC<EmergencyRoomVerificationProps> = () => {
  // Return null as we're not using verification functionality for now
  return null;
};

export default EmergencyRoomVerification;
