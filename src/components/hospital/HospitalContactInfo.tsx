
import React from 'react';
import { Input } from '@/components/ui/input';
import { MapPin, Phone } from 'lucide-react';

interface HospitalContactInfoProps {
  address: string | undefined;
  googleMapsLink: string;
  phone: string;
  onGoogleMapsLinkChange: (link: string) => void;
  onPhoneChange: (phone: string) => void;
}

export const HospitalContactInfo: React.FC<HospitalContactInfoProps> = ({
  address,
  googleMapsLink,
  phone,
  onGoogleMapsLinkChange,
  onPhoneChange
}) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h4 className="font-medium">Address</h4>
        <div className="text-sm border rounded-md p-2 bg-muted/30">
          {address || 'No address available'}
        </div>

        {googleMapsLink && (
          <div className="flex gap-2 items-center">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <a 
              href={googleMapsLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline truncate"
            >
              Google Link
            </a>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h4 className="font-medium">Phone Number</h4>
        <div className="flex gap-2 items-center">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="(123) 456-7890"
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            className="flex-1"
          />
        </div>
      </div>
    </div>
  );
};
