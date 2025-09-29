"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { CalendarDays, DollarSign, Mic, Phone, CheckCircle2, CircleDashed } from 'lucide-react';
import EditEventDialog from './EditEventDialog';

interface Event {
  id: string;
  event_name: string | null;
  event_date: string;
  artist_name: string | null;
  budget: number;
  contact_phone: string;
  created_at: string;
  signed_contract_url: string | null;
}

interface EventCardMobileProps {
  event: Event;
  onEventUpdated: () => void;
}

const EventCardMobile: React.FC<EventCardMobileProps> = ({ event, onEventUpdated }) => {
  const isSigned = !!event.signed_contract_url;

  return (
    <Card className="w-full shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold">{event.event_name || 'Untitled Event'}</CardTitle>
          <EditEventDialog event={event} onEventUpdated={onEventUpdated} />
        </div>
        <CardDescription className="flex items-center gap-1 text-sm">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          {format(new Date(event.event_date), 'PPP')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Mic className="h-4 w-4 text-muted-foreground" />
          <span>Artist: {event.artist_name || 'N/A'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span>Budget: ${event.budget.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <span>Contact: {event.contact_phone}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          {isSigned ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <CircleDashed className="h-4 w-4 text-yellow-500" />
          )}
          <span>Contract Status: {isSigned ? 'Signed' : 'Pending'}</span>
        </div>
        <Link to={`/events/${event.id}`} className="block mt-4">
          <Button variant="outline" className="w-full">
            View Documents
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};

export default EventCardMobile;