"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import CreateEventDialog from '@/components/CreateEventDialog';
import EditEventDialog from '@/components/EditEventDialog';
import { useSupabase } from '@/integrations/supabase/SessionContextProvider';
import { showError } from '@/utils/toast';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Event {
  id: string;
  event_name: string | null; // Added event_name
  event_date: string;
  artist_name: string | null;
  budget: number;
  contact_phone: string;
  created_at: string;
  signed_contract_url: string | null; // New field
}

const Dashboard = () => {
  const { supabase, session } = useSupabase();
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  const fetchEvents = useCallback(async () => {
    if (!session?.user.id) {
      setEvents([]);
      setLoadingEvents(false);
      return;
    }

    setLoadingEvents(true);
    const { data, error } = await supabase
      .from('events')
      .select('*, signed_contract_url') // Select the new field
      .eq('user_id', session.user.id)
      .order('event_date', { ascending: true });

    if (error) {
      console.error('Error fetching events:', error.message);
      showError('Failed to load your events.');
      setEvents([]);
    } else if (data) {
      setEvents(data as Event[]);
    }
    setLoadingEvents(false);
  }, [session, supabase]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <CreateEventDialog onEventCreated={fetchEvents} />
      </div>
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Your Events</CardTitle>
            <CardDescription>Manage your upcoming events.</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingEvents ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : events.length === 0 ? (
              <p className="text-muted-foreground">No events created yet. Click "Create Your Event" to get started!</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event Name/Theme</TableHead> {/* New Table Head */}
                    <TableHead>Event Date</TableHead>
                    <TableHead>Artist Name</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Contact Phone</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">{event.event_name || 'Untitled Event'}</TableCell> {/* Display event name */}
                      <TableCell>{format(new Date(event.event_date), 'PPP')}</TableCell>
                      <TableCell>{event.artist_name || 'N/A'}</TableCell>
                      <TableCell>${event.budget.toLocaleString()}</TableCell>
                      <TableCell>{event.contact_phone}</TableCell>
                      <TableCell className="text-right flex justify-end space-x-2">
                        <Link to={`/events/${event.id}`}>
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View Event</span>
                          </Button>
                        </Link>
                        <EditEventDialog event={event} onEventUpdated={fetchEvents} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;