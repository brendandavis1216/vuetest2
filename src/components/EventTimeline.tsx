"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { CheckCircle2, CircleDashed } from 'lucide-react'; // Removed Clock icon
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface Event {
  id: string;
  event_name: string | null;
  event_date: string;
  renders_url: string | null;
  contract_url: string | null;
  invoice_url: string | null;
  equipment_list_url: string | null;
  other_documents_url: string | null;
  signed_contract_url: string | null;
  created_at: string;
}

interface EventTimelineProps {
  event: Event;
}

const EventTimeline: React.FC<EventTimelineProps> = ({ event }) => {
  const timelineSteps = [
    {
      label: 'Event Created',
      status: 'completed',
      date: event.created_at,
      description: `Your event "${event.event_name || 'Untitled Event'}" was created.`,
    },
    {
      label: 'Renders Uploaded',
      status: event.renders_url ? 'completed' : 'pending',
      date: null,
      description: event.renders_url ? 'Renders have been uploaded.' : 'Awaiting renders from the team.',
    },
    {
      label: 'Contract Issued',
      status: event.contract_url ? 'completed' : 'pending',
      date: null,
      description: event.contract_url ? 'The event contract has been issued.' : 'The contract is being prepared.',
    },
    {
      label: 'Invoice Issued',
      status: event.invoice_url ? 'completed' : 'pending',
      date: null,
      description: event.invoice_url ? 'The invoice for your event has been issued.' : 'Invoice is pending.',
    },
    {
      label: 'Equipment List Provided',
      status: event.equipment_list_url ? 'completed' : 'pending',
      date: null,
      description: event.equipment_list_url ? 'The equipment list has been provided.' : 'Equipment list is pending.',
    },
    {
      label: 'Other Documents Shared',
      status: event.other_documents_url ? 'completed' : 'pending',
      date: null,
      description: event.other_documents_url ? 'Additional documents have been shared.' : 'No additional documents yet.',
    },
    {
      label: 'Contract Signed',
      status: event.signed_contract_url ? 'completed' : 'pending',
      date: event.signed_contract_url ? new Date().toISOString() : null,
      description: event.signed_contract_url ? 'The contract has been successfully signed!' : 'Awaiting your signed contract.',
    },
    {
      label: 'Event Date',
      status: new Date(event.event_date) <= new Date() ? 'completed' : 'pending',
      date: event.event_date,
      description: `The event is scheduled for ${format(new Date(event.event_date), 'PPP')}.`,
    },
  ];

  return (
    <Card className="shadow-lg border-l-4 border-primary">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold">Event Progress Timeline</CardTitle>
        <CardDescription>Track the key milestones for your event.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative flex items-center justify-between w-full overflow-x-auto py-8">
          {/* Central horizontal line */}
          <div className="absolute inset-y-1/2 left-0 right-0 h-0.5 bg-gray-300 z-0" />

          {/* Timeline steps container */}
          <div className="flex flex-row justify-between w-full z-10">
            {timelineSteps.map((step, index) => {
              const IconComponent = step.status === 'completed' ? CheckCircle2 : CircleDashed;
              const iconColorClass = step.status === 'completed' ? 'bg-green-500' : 'bg-gray-400';

              return (
                <div key={index} className="flex flex-col items-center text-center flex-shrink-0 w-28 px-1 sm:w-32 md:w-40"> {/* Adjusted width for mobile */}
                  {/* Icon */}
                  <div className={cn("h-8 w-8 rounded-full flex items-center justify-center mb-2", iconColorClass)}>
                    <IconComponent className="h-5 w-5 text-white" />
                  </div>
                  {/* Content */}
                  <h3 className={cn(
                    "font-semibold text-sm mt-2",
                    step.status === 'completed' ? 'text-foreground' : 'text-muted-foreground'
                  )}>
                    {step.label}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                  {step.date && (
                    <p className="text-xs text-gray-500 mt-1">
                      {format(new Date(step.date), 'PPP')}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EventTimeline;