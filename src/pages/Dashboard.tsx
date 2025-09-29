"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import CreateEventDialog from '@/components/CreateEventDialog';
import EditEventDialog from '@/components/EditEventDialog';
import { useSupabase } from '@/integrations/supabase/SessionContextProvider';
import { showError } from '@/utils/toast';
import { format, isPast } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import MobileHeader from '@/components/MobileHeader'; // New import
import FloatingActionButton from '@/components/FloatingActionButton'; // New import
import EventCardMobile from '@/components/EventCardMobile'; // New import
import { useIsMobile } from '@/hooks/use-mobile'; // New import

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

const Dashboard = () => {
  const { supabase, session } = useSupabase();
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [pastEvents, setPastEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const isMobile = useIsMobile(); // Use the hook

  const fetchEvents = useCallback(async () => {
    if (!session?.user.id) {
      setUpcomingEvents([]);
      setPastEvents([]);
      setLoadingEvents(false);
      return;
    }

    setLoadingEvents(true);
    const { data, error } = await supabase
      .from('events')
      .select('*, signed_contract_url')
      .eq('user_id', session.user.id)
      .order('event_date', { ascending: true });

    if (error) {
      console.error('Error fetching events:', error.message);
      showError('Failed to load your events.');
      setUpcomingEvents([]);
      setPastEvents([]);
    } else if (data) {
      const now = new Date();
      const upcoming = data.filter(event => !isPast(new Date(event.event_date), { inclusive: true }));
      const past = data.filter(event => isPast(new Date(event.event_date), { inclusive: false }));

      upcoming.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
      past.sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());

      setUpcomingEvents(upcoming as Event[]);
      setPastEvents(past as Event[]);
    }
    setLoadingEvents(false);
  }, [session, supabase]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return (
    <div className="min-h-screen flex flex-col">
      {isMobile && <MobileHeader title="Dashboard" />}

      <div className="flex-grow p-4 pb-20 space-y-6"> {/* Adjusted padding for mobile and bottom nav */}
        {!isMobile && (
          <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
            <h1 className="text-4xl font-bold text-foreground text-center sm:text-left">Dashboard</h1>
            <CreateEventDialog onEventCreated={fetchEvents} />
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 mb-8">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold">Upcoming Events</CardTitle>
              <CardDescription>Your events scheduled for today and the future.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingEvents ? (
                <div className="space-y-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : upcomingEvents.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No upcoming events. Click "Create Your Event" to get started!</p>
              ) : (
                isMobile ? (
                  <div className="space-y-4">
                    {upcomingEvents.map((event) => (
                      <EventCardMobile key={event.id} event={event} onEventUpdated={fetchEvents} />
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Event Name/Theme</TableHead>
                          <TableHead>Event Date</TableHead>
                          <TableHead>Artist Name</TableHead>
                          <TableHead>Budget</TableHead>
                          <TableHead>Contact Phone</TableHead>
                          <TableHead className="text-center">View Documents</TableHead>
                          <TableHead className="text-center">Edit</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {upcomingEvents.map((event) => (
                          <TableRow key={event.id}>
                            <TableCell className="font-medium">{event.event_name || 'Untitled Event'}</TableCell>
                            <TableCell>{format(new Date(event.event_date), 'PPP')}</TableCell>
                            <TableCell>{event.artist_name || 'N/A'}</TableCell>
                            <TableCell>${event.budget.toLocaleString()}</TableCell>
                            <TableCell>{event.contact_phone}</TableCell>
                            <TableCell className="text-center">
                              <Link to={`/events/${event.id}`}>
                                <Button variant="outline" size="sm">
                                  View Documents
                                </Button>
                              </Link>
                            </TableCell>
                            <TableCell className="text-center">
                              <EditEventDialog event={event} onEventUpdated={fetchEvents} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold">Past Events</CardTitle>
              <CardDescription>Events that have already occurred.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingEvents ? (
                <div className="space-y-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : pastEvents.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No past events to display.</p>
              ) : (
                isMobile ? (
                  <div className="space-y-4">
                    {pastEvents.map((event) => (
                      <EventCardMobile key={event.id} event={event} onEventUpdated={fetchEvents} />
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Event Name/Theme</TableHead>
                          <TableHead>Event Date</TableHead>
                          <TableHead>Artist Name</TableHead>
                          <TableHead>Budget</TableHead>
                          <TableHead>Contact Phone</TableHead>
                          <TableHead className="text-center">View Documents</TableHead>
                          <TableHead className="text-center">Edit</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pastEvents.map((event) => (
                          <TableRow key={event.id}>
                            <TableCell className="font-medium">{event.event_name || 'Untitled Event'}</TableCell>
                            <TableCell>{format(new Date(event.event_date), 'PPP')}</TableCell>
                            <TableCell>{event.artist_name || 'N/A'}</TableCell>
                            <TableCell>${event.budget.toLocaleString()}</TableCell>
                            <TableCell>{event.contact_phone}</TableCell>
                            <TableCell className="text-center">
                              <Link to={`/events/${event.id}`}>
                                <Button variant="outline" size="sm">
                                  View Documents
                                </Button>
                              </Link>
                            </TableCell>
                            <TableCell className="text-center">
                              <EditEventDialog event={event} onEventUpdated={fetchEvents} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {isMobile && (
        <CreateEventDialog onEventCreated={fetchEvents}>
          <FloatingActionButton label="Create Event" icon={Plus} />
        </CreateEventDialog>
      )}
    </div>
  );
};

export default Dashboard;