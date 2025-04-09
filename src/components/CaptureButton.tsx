
import React from 'react';
import { Button } from './ui/button';
import { Camera, RefreshCw } from 'lucide-react';
import { useMapCapture } from '../hooks/useMapCapture';

const CaptureButton = () => {
  const { capturing, needsCapture, captureMap } = useMapCapture();
  
  return (
    <Button 
      variant={needsCapture ? "destructive" : "outline"}
      onClick={captureMap} 
      disabled={capturing}
      className="flex items-center gap-2"
    >
      {needsCapture ? (
        <RefreshCw className={`h-4 w-4 ${capturing ? 'animate-pulse' : 'animate-spin'}`} />
      ) : (
        <Camera className={`h-4 w-4 ${capturing ? 'animate-pulse' : ''}`} />
      )}
      {capturing ? 'Capturing...' : needsCapture ? 'Recapture Map' : 'Capture Map'}
    </Button>
  );
};

export default CaptureButton;
