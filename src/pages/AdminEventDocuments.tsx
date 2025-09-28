"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabase } from '@/integrations/supabase/SessionContextProvider';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { showSuccess, showError } from '@/utils/toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FolderOpen } from 'lucide-react';
import DocumentUploadCard from '@/components/DocumentUploadCard'; // Import the new component
import { format } from 'date-fns';

interface Event {
  id: string;
  event_name: string | null;
  event_date: string;
  artist_name: string | null;
  budget: number;
  contact_phone: string;
  renders_url: string | null;
  contract_url: string | null;
  invoice_url: string | null;
  equipment_list_url: string | null;
  other_documents_url: string | null;
  signed_contract_url: string | null; // New field
}

const AdminEventDocuments = () => {
  const { supabase, session } = useSupabase();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingAdminStatus, setLoadingAdminStatus] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

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
      showError('Failed to verify admin status.');
      setIsAdmin(false);
    } else {
      setIsAdmin(data);
    }
    setLoadingAdminStatus(false);
  }, [session, supabase]);

  const fetchAllEvents = useCallback(async () => {
    setLoadingEvents(true);
    const { data, error } = await supabase
      .from('events')
      .select('*, signed_contract_url') // Select the new field
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all events:', error.message);
      showError('Failed to load all events.');
      setEvents([]);
    } else if (data) {
      setEvents(data as Event[]);
      showSuccess('All events loaded successfully!');
    }
    setLoadingEvents(false);
  }, [supabase]);

  useEffect(() => {
    checkAdminStatus();
  }, [checkAdminStatus]);

  useEffect(() => {
    if (!loadingAdminStatus) {
      if (!isAdmin) {
        showError('You do not have administrative access to manage documents.');
        navigate('/dashboard', { replace: true });
      } else {
        fetchAllEvents();
      }
    }
  }, [isAdmin, loadingAdminStatus, navigate, fetchAllEvents]);

  const handleEventDocumentUpdated = () => {
    // Re-fetch the selected event to get updated URLs
    if (selectedEvent) {
      supabase
        .from('events')
        .select('*, signed_contract_url') // Select the new field
        .eq('id', selectedEvent.id)
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error('Error re-fetching event:', error.message);
            showError('Failed to refresh event data.');
          } else if (data) {
            setSelectedEvent(data as Event);
          }
        });
    }
    fetchAllEvents(); // Also refresh the list of events in case something changed
  };

  if (loadingAdminStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Verifying admin status...</p>
      </div>
    );
  }

  if (loadingEvents) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading events...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" onClick={() => navigate('/admin')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Admin Dashboard
        </Button>
        <h1 className="text-3xl font-bold">Manage Event Documents</h1>
      </div>

      {!selectedEvent ? (
        <Card>
          <CardHeader>
            <CardTitle>Select an Event</CardTitle>
            <CardDescription>Choose an event from the list below to manage its associated documents.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event Name/Theme</TableHead>
                  <TableHead>Event Date</TableHead>
                  <TableHead>Artist Name</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.event_name || 'Untitled Event'}</TableCell>
                    <TableCell>{format(new Date(event.event_date), 'PPP')}</TableCell>
                    <TableCell>{event.artist_name || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => setSelectedEvent(event)}>
                        <FolderOpen className="mr-2 h-4 w-4" /> Manage Documents
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-6">
            <Button variant="outline" onClick={() => setSelectedEvent(null)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Event List
            </Button>
            <h2 className="text-2xl font-bold">Documents for: {selectedEvent.event_name || 'Untitled Event'}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Signed Contract: Admin can only view */}
            <DocumentUploadCard
              eventId={selectedEvent.id}
              documentType="signed_contract"
              currentUrl={selectedEvent.signed_contract_url}
              onDocumentUpdated={handleEventDocumentUpdated}
              readOnly={true} // Admin can only view this document
            />
            {/* Other Documents: Admin can upload/delete */}
            <DocumentUploadCard
              eventId={selectedEvent.id}
              documentType="renders"
              currentUrl={selectedEvent.renders_url}
              onDocumentUpdated={handleEventDocumentUpdated}
              readOnly={false}
            />
            <DocumentUploadCard
              eventId={selectedEvent.id}
              documentType="contract"
              currentUrl={selectedEvent.contract_url}
              onDocumentUpdated={handleEventDocumentUpdated}
              readOnly={false}
            />
            <DocumentUploadCard
              eventId={selectedEvent.id}
              documentType="invoice"
              currentUrl={selectedEvent.invoice_url}
              onDocumentUpdated={handleEventDocumentUpdated}
              readOnly={false}
            />
            <DocumentUploadCard
              eventId={selectedEvent.id}
              documentType="equipment_list"
              currentUrl={selectedEvent.equipment_list_url}
              onDocumentUpdated={handleEventDocumentUpdated}
              readOnly={false}
            />
            <DocumentUploadCard
              eventId={selectedEvent.id}
              documentType="other_documents"
              currentUrl={selectedEvent.other_documents_url}
              onDocumentUpdated={handleEventDocumentUpdated}
              readOnly={false}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEventDocuments;