"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom'; // Import Link
import { useSupabase } from '@/integrations/supabase/SessionContextProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { showError } from '@/utils/toast';
import { format } from 'date-fns';
import { ArrowLeft, Image } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import DocumentUploadCard from '@/components/DocumentUploadCard';
import EventChecklist from '@/components/EventChecklist';
import EventTimeline from '@/components/EventTimeline';

interface Event {
  id: string;
  event_name: string | null;
  event_date: string;
  artist_name: string | null;
  budget: number;
  contact_phone: string;
  created_at: string;
  user_id: string;
  renders_url: string | null;
  contract_url: string | null;
  invoice_url: string | null;
  equipment_list_url: string | null;
  other_documents_url: string | null;
  signed_contract_url: string | null;
}

const EventDetails = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { supabase, session } = useSupabase();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingAdminStatus, setLoadingAdminStatus] = useState(true);

  const checkAdminStatus = useCallback(async () => {
    setLoadingAdminStatus(true);
    if (!session) {
      setIsAdmin(false);
      setLoadingAdminStatus(false);
      return;
    }
    const { data, error } = await supabase.rpc('is_admin');
    if (error) {
      console.error('Error checking admin role:', error.message);
      setIsAdmin(false);
    } else {
      setIsAdmin(data);
    }
    setLoadingAdminStatus(false);
  }, [session, supabase]);

  const fetchEventDetails = useCallback(async () => {
    if (!eventId) {
      showError('Event ID missing.');
      navigate('/dashboard', { replace: true });
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('events')
      .select('*, signed_contract_url')
      .eq('id', eventId)
      .single();

    if (error) {
      console.error('Error fetching event details:', error.message);
      showError('Failed to load event details. You might not have access.');
      navigate(isAdmin ? '/admin' : '/dashboard', { replace: true });
    } else if (data) {
      setEvent(data as Event);
    }
    setLoading(false);
  }, [eventId, supabase, navigate, isAdmin]);

  useEffect(() => {
    checkAdminStatus();
  }, [checkAdminStatus]);

  useEffect(() => {
    if (!loadingAdminStatus) {
      fetchEventDetails();
    }
  }, [loadingAdminStatus, fetchEventDetails]);

  if (loading || loadingAdminStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Skeleton className="h-[300px] w-full max-w-4xl" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold mb-4 text-foreground">Event Not Found</h2>
        <p className="text-muted-foreground mb-6">The event you are looking for does not exist or you do not have permission to view it.</p>
        <Button onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')}>
          <>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to {isAdmin ? 'Admin Dashboard' : 'Dashboard'}
          </>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20 space-y-8"> {/* Adjusted padding for mobile and bottom nav */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <Button variant="outline" onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')}>
          <>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to {isAdmin ? 'Admin Dashboard' : 'Dashboard'}
          </>
        </Button>
        <h1 className="text-4xl font-bold text-foreground text-center sm:text-left">Event: {event.event_name || 'Untitled Event'}</h1>
      </div>

      {/* Conditional rendering for Checklist vs. Timeline */}
      {isAdmin ? (
        <EventChecklist event={event} />
      ) : (
        <EventTimeline event={event} />
      )}

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Event Overview</CardTitle>
          <CardDescription>Key details about your event.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"> {/* Ensure 1 column on mobile */}
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

      {/* New section for Media Management */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Media Management</CardTitle>
          <CardDescription>View and upload photos or videos related to this event.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Link to={`/events/${event.id}/media`}>
            <Button size="lg">
              <>
                <Image className="mr-2 h-5 w-5" /> View/Add Media
              </>
            </Button>
          </Link>
        </CardContent>
      </Card>

      <h2 className="text-3xl font-bold mt-8 mb-4 text-foreground">Event Documents</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"> {/* Ensure 1 column on mobile */}
        {/* Signed Contract: Client uploads, Admin views */}
        <DocumentUploadCard
          eventId={event.id}
          documentType="signed_contract"
          currentUrl={event.signed_contract_url}
          onDocumentUpdated={fetchEventDetails}
          readOnly={isAdmin} // Client can upload (readOnly=false), Admin can only view (readOnly=true)
        />

        {/* Other Documents: Admin uploads, Client views */}
        <DocumentUploadCard
          eventId={event.id}
          documentType="renders"
          currentUrl={event.renders_url}
          onDocumentUpdated={fetchEventDetails}
          readOnly={!isAdmin} // Admin can upload (readOnly=false), Client can only view (readOnly=true)
        />
        <DocumentUploadCard
          eventId={event.id}
          documentType="contract"
          currentUrl={event.contract_url}
          onDocumentUpdated={fetchEventDetails}
          readOnly={!isAdmin}
        />
        <DocumentUploadCard
          eventId={event.id}
          documentType="invoice"
          currentUrl={event.invoice_url}
          onDocumentUpdated={fetchEventDetails}
          readOnly={!isAdmin}
        />
        <DocumentUploadCard
          eventId={event.id}
          documentType="equipment_list"
          currentUrl={event.equipment_list_url}
          onDocumentUpdated={fetchEventDetails}
          readOnly={!isAdmin}
        />
        <DocumentUploadCard
          eventId={event.id}
          documentType="other_documents"
          currentUrl={event.other_documents_url}
          onDocumentUpdated={fetchEventDetails}
          readOnly={!isAdmin}
        />
      </div>
    </div>
  );
};

export default EventDetails;