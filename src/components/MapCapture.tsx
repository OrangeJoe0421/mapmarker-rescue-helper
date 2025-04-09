
import React from 'react';
import CaptureButton from './CaptureButton';
import { mapCaptureService } from '../services/mapCaptureService';

// Export the service for other components to use
export { mapCaptureService };

const MapCapture = () => {
  return <CaptureButton />;
};

export default MapCapture;
