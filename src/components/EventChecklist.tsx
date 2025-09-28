"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface Event {
  id: string;
  event_name: string | null;
  renders_url: string | null;
  contract_url: string | null;
  invoice_url: string | null;
  equipment_list_url: string | null;
  other_documents_url: string | null;
  signed_contract_url: string | null;
}

interface EventChecklistProps {
  event: Event;
}

const EventChecklist: React.FC<EventChecklistProps> = ({ event }) => {
  const checklistItems = [
    { label: 'Event Created', checked: true }, // Always true if we're viewing the event
    { label: 'Renders Uploaded', checked: !!event.renders_url },
    { label: 'Contract Uploaded', checked: !!event.contract_url },
    { label: 'Invoice Uploaded', checked: !!event.invoice_url },
    { label: 'Equipment List Uploaded', checked: !!event.equipment_list_url },
    { label: 'Other Documents Uploaded', checked: !!event.other_documents_url },
    { label: 'Signed Contract Uploaded', checked: !!event.signed_contract_url },
  ];

  return (
    <Card className="shadow-lg border-l-4 border-primary">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold">Event Progress Checklist</CardTitle>
        <CardDescription>Track the completion status of key event documents.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {checklistItems.map((item, index) => (
          <div key={index} className="flex items-center space-x-2">
            <Checkbox
              id={`checklist-item-${index}`}
              checked={item.checked}
              disabled
              className="data-[state=checked]:bg-green-500 data-[state=checked]:text-white" // Green background, white checkmark
            />
            <Label htmlFor={`checklist-item-${index}`} className="text-base font-medium !text-white"> {/* White text */}
              {item.label}
            </Label>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default EventChecklist;