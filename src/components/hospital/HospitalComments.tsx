
import React from 'react';
import { Textarea } from '@/components/ui/textarea';

interface HospitalCommentsProps {
  comments: string;
  onChange: (comments: string) => void;
}

export const HospitalComments: React.FC<HospitalCommentsProps> = ({
  comments,
  onChange
}) => {
  return (
    <div className="space-y-2">
      <h4 className="font-medium">Comments</h4>
      <Textarea 
        placeholder="Add any additional information about this hospital"
        value={comments}
        onChange={(e) => onChange(e.target.value)}
        className="resize-none"
        rows={3}
      />
    </div>
  );
};
