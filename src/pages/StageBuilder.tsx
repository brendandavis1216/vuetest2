"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSupabase } from '@/integrations/supabase/SessionContextProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, LayoutDashboard, Trash2 } from 'lucide-react'; // Added Trash2 for removing items
import { showError, showSuccess } from '@/utils/toast';
import { Skeleton } from '@/components/ui/skeleton';
import StageItemSelector from '@/components/StageItemSelector'; // Import the new StageItemSelector
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';

// Define a type for a stage item (should match StageItemSelector's definition)
interface StageItem {
  id: string;
  name: string;
  category: string;
  icon?: React.ElementType;
}

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
  const [selectedStageItems, setSelectedStageItems] = useState<StageItem[]>([]); // State to hold selected items

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

  const handleAddItemToStage = (item: StageItem) => {
    // For now, just add the item. Later, we might add quantity, position, etc.
    setSelectedStageItems(prevItems => [...prevItems, { ...item, id: `${item.id}-${Date.now()}` }]); // Add unique ID
    showSuccess(`${item.name} added to stage!`);
  };

  const handleRemoveItemFromStage = (itemId: string) => {
    setSelectedStageItems(prevItems => prevItems.filter(item => item.id !== itemId));
    showSuccess('Item removed from stage.');
  };

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

      <ResizablePanelGroup
        direction="horizontal"
        className="min-h-[70vh] w-full rounded-lg border"
      >
        <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
          <div className="flex h-full items-center justify-center p-2">
            <StageItemSelector onAddItem={handleAddItemToStage} />
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={75}>
          <div className="flex h-full flex-col">
            <Card className="flex-grow shadow-lg border-none rounded-none">
              <CardHeader className="border-b">
                <CardTitle className="text-2xl font-semibold flex items-center gap-2">
                  <LayoutDashboard className="h-6 w-6" /> Stage Design Canvas
                </CardTitle>
                <CardDescription>
                  Drag and drop items here to build your stage layout.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow flex items-center justify-center bg-muted rounded-b-md p-4">
                {selectedStageItems.length === 0 ? (
                  <p className="text-muted-foreground text-lg">
                    Start by selecting items from the left panel!
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 w-full h-full overflow-y-auto">
                    {selectedStageItems.map(item => {
                      const ItemIcon = item.icon || Box;
                      return (
                        <Card key={item.id} className="flex flex-col items-center justify-center p-4 text-center relative">
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-6 w-6 rounded-full"
                            onClick={() => handleRemoveItemFromStage(item.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                          <ItemIcon className="h-12 w-12 text-primary mb-2" />
                          <p className="font-semibold text-sm">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.category}</p>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default StageBuilder;