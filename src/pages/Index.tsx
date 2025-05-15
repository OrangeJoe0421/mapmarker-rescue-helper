import React from 'react';
import MapContainer from '@/components/MapContainer';
import { Separator } from '@/components/ui/separator';
import EmergencyServicesList from '@/components/EmergencyServicesList';

const Index = () => {
  return (
    <div className="flex h-screen w-screen flex-col md:flex-row">
      <div className="w-full md:w-1/3 p-4 overflow-auto">
        <EmergencyServicesList />
      </div>
      <Separator orientation="vertical" className="hidden md:block" />
      <div className="flex-1 md:w-2/3">
        <MapContainer />
      </div>
    </div>
  );
};

export default Index;
