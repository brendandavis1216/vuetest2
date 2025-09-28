"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSupabase } from '@/integrations/supabase/SessionContextProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { showError } from '@/utils/toast';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Event {
  id: string;
  event_name: string | null;
  event_date: string;
  artist_name: string | null;
  budget: number;
  contact_phone: string;
  created_at: string;
  user_id: string;
  renders_url: string | null; // New field
  contract_url: string | null; // New field
  invoice_url: string | null; // New field
  equipment_list_url: string | null; // New field
  other_documents_url: string | null; // New field
}

const EventDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { supabase, session } = useSupabase();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchEventDetails = useCallback(async () => {
    if (!id || !session?.user.id) {
      showError('Event ID or user session missing.');
      navigate('/dashboard', { replace: true });
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('events')
      .select('*') // Select all columns, including the new URL fields
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single();

    if (error) {
      console.error('Error fetching event details:', error.message);
      showError('Failed to load event details. You might not have access.');
      navigate('/dashboard', { replace: true });
    } else if (data) {
      setEvent(data as Event);
    }
    setLoading(false);
  }, [id, session, supabase, navigate]);

  useEffect(() => {
    fetchEventDetails();
  }, [fetchEventDetails]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Skeleton className="h-[300px] w-full max-w-4xl" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold mb-4">Event Not Found</h2>
        <p className="text-gray-600 mb-6">The event you are looking for does not exist or you do not have permission to view it.</p>
        <Button onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>
      </div>
    );
  }

  // Function to handle viewing documents
  const handleViewDocument = (url: string | null, documentType: string) => {
    if (url) {
      window.open(url, '_blank');
    } else {
      showError(`No ${documentType} available for this event.`);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>
        <h1 className="text-3xl font-bold">Event: {event.event_name || 'Untitled Event'}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event Overview</CardTitle>
          <CardDescription>Key details about your event.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Event Name/Theme</p>
            <p className="text-lg font-semibold">{event.event_name || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Event Date</p>
            <p className="text-lg font-semibold">{format(new Date(event.event_date), 'PPP')}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Artist Name</p>
            <p className="text-lg font-semibold">{event.artist_name || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Production Budget</p>
            <p className="text-lg font-semibold">${event.budget.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Contact Phone</p>
            <p className="text-lg font-semibold">{event.contact_phone}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Renders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {event.renders_url ? 'Renders available.' : 'No renders available yet.'}
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => handleViewDocument(event.renders_url, 'Renders')}
              disabled={!event.renders_url}
            >
              View Renders
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contract</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {event.contract_url ? 'Contract available.' : 'No contract available yet.'}
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => handleViewDocument(event.contract_url, 'Contract')}
              disabled={!event.contract_url}
            >
              View Contract
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invoice</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {event.invoice_url ? 'Invoice available.' : 'No invoice available yet.'}
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => handleViewDocument(event.invoice_url, 'Invoice')}
              disabled={!event.invoice_url}
            >
              View Invoice
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Equipment List</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {event.equipment_list_url ? 'Equipment list available.' : 'No equipment list available yet.'}
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => handleViewDocument(event.equipment_list_url, 'Equipment List')}
              disabled={!event.equipment_list_url}
            >
              View Equipment List
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Other Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {event.other_documents_url ? 'Other documents available.' : 'No other documents available yet.'}
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => handleViewDocument(event.other_documents_url, 'Other Documents')}
              disabled={!event.other_documents_url}
            >
              View Documents
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EventDetails;