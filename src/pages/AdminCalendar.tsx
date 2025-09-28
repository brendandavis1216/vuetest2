"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabase } from '@/integrations/supabase/SessionContextProvider';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CalendarDays, Circle } from 'lucide-react';
import { showError } from '@/utils/toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';
import { format, isSameMonth, isSameDay } from 'date-fns';

interface Event {
  id: string;
  event_name: string | null;
  event_date: string;
  signed_contract_url: string | null;
  user_id: string;
}

const AdminCalendar = () => {
  const { supabase, session } = useSupabase();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingAdminStatus, setLoadingAdminStatus] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date()); // New state for current month

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
      .select('id, event_name, event_date, signed_contract_url, user_id')
      .order('event_date', { ascending: true });

    if (error) {
      console.error('Error fetching all events for calendar:', error.message);
      showError('Failed to load events for the calendar.');
      setEvents([]);
    } else if (data) {
      setEvents(data as Event[]);
    }
    setLoadingEvents(false);
  }, [supabase]);

  useEffect(() => {
    checkAdminStatus();
  }, [checkAdminStatus]);

  useEffect(() => {
    if (!loadingAdminStatus) {
      if (!isAdmin) {
        showError('You do not have administrative access to view the calendar.');
        navigate('/dashboard', { replace: true });
      } else {
        fetchAllEvents();
      }
    }
  }, [isAdmin, loadingAdminStatus, navigate, fetchAllEvents]);

  const eventsInCurrentMonth = events.filter(event =>
    isSameMonth(new Date(event.event_date), currentMonth)
  ).sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());

  const groupedEvents = eventsInCurrentMonth.reduce((acc, event) => {
    const dateKey = format(new Date(event.event_date), 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(event);
    return acc;
  }, {} as Record<string, Event[]>);

  const modifiers = events.reduce((acc: { [key: string]: Date[] }, event) => {
    const date = new Date(event.event_date);
    const key = event.signed_contract_url ? 'eventGreen' : 'eventYellow'; // Green for signed, Yellow for pending
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(date);
    return acc;
  }, {});

  if (loadingAdminStatus || loadingEvents) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading calendar data...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" onClick={() => navigate('/admin')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Admin Dashboard
        </Button>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <CalendarDays className="h-7 w-7" /> Event Calendar
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Event Overview</CardTitle>
            <CardDescription>Select a date to view events.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              month={currentMonth} // Control the displayed month
              onMonthChange={setCurrentMonth} // Update currentMonth when navigating
              className="rounded-md border"
              modifiers={modifiers}
              modifiersClassNames={{
                eventGreen: 'rdp-day_eventGreen',
                eventYellow: 'rdp-day_eventYellow',
              }}
            />
            <div className="mt-4 flex flex-col space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Circle className="h-3 w-3 text-green-500 fill-green-500" />
                <span>Contract Signed</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Circle className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                <span>Contract Pending</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Events in {format(currentMonth, 'MMMM yyyy')}</CardTitle>
            <CardDescription>All events scheduled for this month.</CardDescription>
          </CardHeader>
          <CardContent>
            {eventsInCurrentMonth.length === 0 ? (
              <p className="text-muted-foreground">No events scheduled for this month.</p>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {Object.entries(groupedEvents).map(([dateKey, dailyEvents]) => (
                  <div key={dateKey} className="border-b pb-2 last:border-b-0">
                    <h3 className="font-semibold text-md mb-2">
                      {format(new Date(dateKey), 'PPP')}
                      {isSameDay(new Date(dateKey), selectedDate || new Date()) && (
                        <span className="ml-2 text-xs text-primary-foreground bg-primary px-2 py-1 rounded-full">Selected</span>
                      )}
                    </h3>
                    <div className="space-y-2">
                      {dailyEvents.map(event => (
                        <div key={event.id} className="border p-3 rounded-md shadow-sm flex justify-between items-center">
                          <div>
                            <h4 className="font-medium text-base">{event.event_name || 'Untitled Event'}</h4>
                            <p className="text-sm text-muted-foreground">
                              Status: {event.signed_contract_url ? 'Contract Signed' : 'Contract Pending'}
                            </p>
                          </div>
                          <Button variant="link" className="p-0 h-auto" onClick={() => navigate(`/events/${event.id}`)}>
                            View Details
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminCalendar;