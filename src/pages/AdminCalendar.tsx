"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSupabase } from '@/integrations/supabase/SessionContextProvider';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CalendarDays, FileText, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { showError } from '@/utils/toast';
import { Skeleton } from '@/components/ui/skeleton';
import { format, isSameDay, isWithinInterval, startOfMonth, endOfMonth } from 'date-fns';
import { DayPicker, DateFormatter } from 'react-day-picker';
import 'react-day-picker/dist/style.css'; // Import the default styles
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

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

type EventStatus = 'red' | 'yellow' | 'green';

const calculateCompletionPercentage = (event: Event) => {
  const documentFields = [
    event.renders_url,
    event.contract_url,
    event.invoice_url,
    event.equipment_list_url,
    event.other_documents_url,
    // signed_contract_url is handled separately for green status
  ];
  const uploadedCount = documentFields.filter(url => url !== null).length;
  const totalCategories = documentFields.length;
  return totalCategories > 0 ? (uploadedCount / totalCategories) * 100 : 0;
};

const getEventStatus = (event: Event): EventStatus => {
  if (event.signed_contract_url) {
    return 'green';
  }
  const completionPercentage = calculateCompletionPercentage(event);
  if (completionPercentage > 0) {
    return 'yellow';
  }
  return 'red';
};

const AdminCalendar = () => {
  const { supabase, session } = useSupabase();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingAdminStatus, setLoadingAdminStatus] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [eventsByDate, setEventsByDate] = useState<Map<string, Event[]>>(new Map());
  const [dayColors, setDayColors] = useState<Map<string, EventStatus>>(new Map());
  
  // State to manage the currently displayed month in the calendar
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [displayedMonthEvents, setDisplayedMonthEvents] = useState<Event[]>([]);

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
      .select('*, renders_url, contract_url, invoice_url, equipment_list_url, other_documents_url, signed_contract_url')
      .order('event_date', { ascending: true });

    if (error) {
      console.error('Error fetching all events:', error.message);
      showError('Failed to load all events.');
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

  useEffect(() => {
    const newEventsByDate = new Map<string, Event[]>();
    const newDayColors = new Map<string, EventStatus>();

    events.forEach(event => {
      const dateKey = format(new Date(event.event_date), 'yyyy-MM-dd');
      if (!newEventsByDate.has(dateKey)) {
        newEventsByDate.set(dateKey, []);
      }
      newEventsByDate.get(dateKey)?.push(event);

      // Determine the highest status for the day
      const currentDayStatus = newDayColors.get(dateKey);
      const eventStatus = getEventStatus(event);

      if (eventStatus === 'green') {
        newDayColors.set(dateKey, 'green');
      } else if (eventStatus === 'yellow' && currentDayStatus !== 'green') {
        newDayColors.set(dateKey, 'yellow');
      } else if (eventStatus === 'red' && currentDayStatus !== 'green' && currentDayStatus !== 'yellow') {
        newDayColors.set(dateKey, 'red');
      }
    });

    setEventsByDate(newEventsByDate);
    setDayColors(newDayColors);

    // Filter events for the currently displayed month
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const filtered = events.filter(event => 
      isWithinInterval(new Date(event.event_date), { start, end })
    );
    setDisplayedMonthEvents(filtered);

  }, [events, currentMonth]); // Re-run when events or currentMonth changes

  const modifiers = {
    eventRed: (date: Date) => {
      const dateKey = format(date, 'yyyy-MM-dd');
      return dayColors.get(dateKey) === 'red';
    },
    eventYellow: (date: Date) => {
      const dateKey = format(date, 'yyyy-MM-dd');
      return dayColors.get(dateKey) === 'yellow';
    },
    eventGreen: (date: Date) => {
      const dateKey = format(date, 'yyyy-MM-dd');
      return dayColors.get(dateKey) === 'green';
    },
  };

  const modifierStyles = {
    eventRed: { backgroundColor: 'hsl(0 84.2% 60.2%)', color: 'white' }, // destructive color
    eventYellow: { backgroundColor: 'hsl(48 96% 89%)', color: 'hsl(24 9.8% 10%)' }, // accent color, but a bit more visible
    eventGreen: { backgroundColor: 'hsl(142.1 76.2% 36.3%)', color: 'white' }, // green color
  };

  const formatCaption: DateFormatter = (month, options) => {
    const y = month.getFullYear();
    const m = format(month, 'LLLL', { locale: options?.locale });
    return `${m} ${y}`;
  };

  if (loadingAdminStatus || loadingEvents) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Skeleton className="h-[300px] w-full max-w-4xl" />
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

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Event Overview by Date</CardTitle>
          <CardDescription>View all events on a calendar, color-coded by their document completion status.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <DayPicker
              mode="single"
              month={currentMonth} // Control the displayed month
              onMonthChange={setCurrentMonth} // Update currentMonth when navigating
              modifiers={modifiers}
              modifierStyles={modifierStyles}
              formatters={{ formatCaption }}
              className="rdp-custom-styles"
              styles={{
                caption: { display: 'flex', justifyContent: 'center', alignItems: 'center' },
                caption_label: { fontSize: '1.2em', fontWeight: 'bold' },
                nav_button: { width: '2em', height: '2em' },
                head_cell: { color: 'hsl(var(--muted-foreground))' },
                day: { padding: '0.5em', borderRadius: '0.375rem' },
                day_selected: { backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' },
                day_today: { fontWeight: 'bold', border: '1px solid hsl(var(--border))' },
              }}
            />
            <div className="mt-4 flex justify-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <XCircle className="h-4 w-4 text-destructive" /> Not Started
              </span>
              <span className="flex items-center gap-1">
                <AlertCircle className="h-4 w-4 text-yellow-500" /> In Progress
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" /> Completed
              </span>
            </div>
          </div>

          <div className="flex-1 border-t md:border-t-0 md:border-l pt-6 md:pt-0 md:pl-6 border-border">
            <h3 className="text-xl font-semibold mb-4">
              Events for {format(currentMonth, 'MMMM yyyy')}
            </h3>
            {displayedMonthEvents.length > 0 ? (
              <div className="space-y-4">
                {displayedMonthEvents
                  .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
                  .map(event => (
                  <Card key={event.id} className="p-4">
                    <CardTitle className="text-lg mb-2">
                      <Link to={`/events/${event.id}`} className="hover:underline">
                        {event.event_name || 'Untitled Event'}
                      </Link>
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Date: {format(new Date(event.event_date), 'PPP')} <br />
                      Artist: {event.artist_name || 'N/A'} <br />
                      Budget: ${event.budget.toLocaleString()} <br />
                      Status: {getEventStatus(event) === 'green' ? 'Completed' : getEventStatus(event) === 'yellow' ? 'In Progress' : 'Not Started'}
                    </CardDescription>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No events scheduled for this month.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCalendar;