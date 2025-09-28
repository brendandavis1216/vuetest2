"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSupabase } from '@/integrations/supabase/SessionContextProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, LayoutDashboard } from 'lucide-react';
import { showError } from '@/utils/toast';
import { Skeleton } from '@/components/ui/skeleton';

interface Event {
  id: string;
  event_name: string | null;
  user_id: string;
}

const StageBuilder = () => {
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
    try {
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('id, event_name, user_id')
        .eq('id', eventId)
        .single();

      if (eventError) {
        throw new Error(eventError.message);
      }
      if (!eventData) {
        throw new Error('Event not found.');
      }

      // Check if the current user is the owner of the event or an admin
      const isOwner = session?.user.id === eventData.user_id;
      if (!isOwner && !isAdmin) {
        showError('You do not have permission to access this event\'s stage builder.');
        navigate('/dashboard', { replace: true });
        return;
      }

      setEvent(eventData as Event);

    } catch (error: any) {
      console.error('Error fetching event details for stage builder:', error.message);
      showError(`Failed to load event for stage builder: ${error.message}`);
      navigate(isAdmin ? '/admin' : '/dashboard', { replace: true });
    } finally {
      setLoading(false);
    }
  }, [eventId, supabase, session, navigate, isAdmin]);

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
        <p className="text-muted-foreground mb-6">The event you are looking for does not exist or you do not have permission to access its stage builder.</p>
        <Button onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to {isAdmin ? 'Admin Dashboard' : 'Dashboard'}
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <Button variant="outline" onClick={() => navigate(`/events/${eventId}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Event Details
        </Button>
        <h1 className="text-4xl font-bold text-foreground text-center sm:text-left">Stage Builder for: {event.event_name || 'Untitled Event'}</h1>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6" /> Stage Design Interface
          </CardTitle>
          <CardDescription>
            This is where you can design and visualize your event stage. (Feature under development)
          </CardDescription>
        </CardHeader>
        <CardContent className="min-h-[400px] flex items-center justify-center bg-muted rounded-md border border-dashed">
          <p className="text-muted-foreground text-lg">
            Stage building tools will appear here!
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default StageBuilder;