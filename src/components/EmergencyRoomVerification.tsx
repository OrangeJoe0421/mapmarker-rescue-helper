
import React from 'react';
import { EmergencyService } from '@/types/mapTypes';

interface EmergencyRoomVerificationProps {
  service: EmergencyService;
}

// This component has been disabled as per user request
const EmergencyRoomVerification: React.FC<EmergencyRoomVerificationProps> = ({ service }) => {
  // Simply return null to disable this component
  return null;
};

export default EmergencyRoomVerification;
