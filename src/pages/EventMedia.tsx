"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSupabase } from '@/integrations/supabase/SessionContextProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { showError } from '@/utils/toast';
import { ArrowLeft, Image, Video } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import MediaUploadCard from '@/components/MediaUploadCard'; // Import the new MediaUploadCard

interface MediaItem {
  id: string;
  event_id: string;
  url: string;
  type: string;
  uploaded_by: string;
  created_at: string;
}

interface Event {
  id: string;
  event_name: string | null;
  user_id: string;
}

const EventMedia = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { supabase, session } = useSupabase();
  const [event, setEvent] = useState<Event | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
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

  const fetchEventAndMedia = useCallback(async () => {
    if (!eventId) {
      showError('Event ID missing.');
      navigate('/dashboard', { replace: true });
      return;
    }

    setLoading(true);
    try {
      // Fetch event details
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
        showError('You do not have permission to view this event\'s media.');
        navigate('/dashboard', { replace: true });
        return;
      }

      setEvent(eventData as Event);

      // Fetch media for the event
      const { data: mediaData, error: mediaError } = await supabase
        .from('media')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (mediaError) {
        throw new Error(mediaError.message);
      }
      setMedia(mediaData as MediaItem[]);

    } catch (error: any) {
      console.error('Error fetching event media:', error.message);
      showError(`Failed to load event media: ${error.message}`);
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
      fetchEventAndMedia();
    }
  }, [loadingAdminStatus, fetchEventAndMedia]);

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
        <p className="text-muted-foreground mb-6">The event you are looking for does not exist or you do not have permission to view its media.</p>
        <Button onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to {isAdmin ? 'Admin Dashboard' : 'Dashboard'}
        </Button>
      </div>
    );
  }

  const isEventOwner = session?.user.id === event.user_id;
  const canUpload = isEventOwner || isAdmin; // Both owner and admin can upload
  const canDelete = isEventOwner || isAdmin; // Both owner and admin can delete

  return (
    <div className="p-4 pb-20 space-y-8"> {/* Adjusted padding for mobile and bottom nav */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <Button variant="outline" onClick={() => navigate(`/events/${eventId}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Event Details
        </Button>
        <h1 className="text-4xl font-bold text-foreground text-center sm:text-left">Media for: {event.event_name || 'Untitled Event'}</h1>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Upload New Media</CardTitle>
          <CardDescription>Add photos or videos from your event.</CardDescription>
        </CardHeader>
        <CardContent>
          <MediaUploadCard eventId={eventId!} onMediaUpdated={fetchEventAndMedia} readOnly={!canUpload} />
        </CardContent>
      </Card>

      <h2 className="text-3xl font-bold mt-8 mb-4 text-foreground">Existing Media</h2>
      {media.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No media uploaded for this event yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"> {/* Ensure 1 column on mobile */}
          {media.map((item) => (
            <MediaUploadCard
              key={item.id}
              eventId={eventId!}
              mediaItem={item}
              onMediaUpdated={fetchEventAndMedia}
              readOnly={!canDelete} // Only allow deletion if owner or admin
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default EventMedia;