"use client";

import { useEffect, useCallback } from 'react';
import { useSupabase } from '@/integrations/supabase/SessionContextProvider';
import { showSuccess } from '@/utils/toast';

interface EventUpdatePayload {
  old: {
    id: string;
    event_name: string | null;
    signed_contract_url: string | null;
    user_id: string;
  };
  new: {
    id: string;
    event_name: string | null;
    signed_contract_url: string | null;
    user_id: string;
  };
}

export const useAdminEventNotifications = () => {
  const { supabase, session } = useSupabase();

  const handleRealtimeUpdate = useCallback(async (payload: { new: any; old: any }) => {
    const { old, new: updatedEvent } = payload as EventUpdatePayload;

    // Only proceed if an admin is logged in
    if (!session?.user) {
      return;
    }

    const { data: isAdmin, error: adminCheckError } = await supabase.rpc('is_admin');
    if (adminCheckError || !isAdmin) {
      return; // Not an admin, so don't show admin notifications
    }

    // Check if the signed_contract_url has changed from null to a value
    if (!old.signed_contract_url && updatedEvent.signed_contract_url) {
      const eventName = updatedEvent.event_name || 'an Untitled Event';

      // Fetch client's profile to get school/fraternity for a more descriptive notification
      const { data: clientProfile, error: profileError } = await supabase
        .from('profiles')
        .select('school, fraternity')
        .eq('id', updatedEvent.user_id)
        .single();

      let clientIdentifier = 'A client';
      if (clientProfile && (clientProfile.school || clientProfile.fraternity)) {
        clientIdentifier = `${clientProfile.school || ''} ${clientProfile.fraternity || ''}`.trim();
        if (clientIdentifier === '') clientIdentifier = 'A client'; // Fallback if both are null
      }

      showSuccess(`${clientIdentifier} has uploaded a signed contract for "${eventName}"!`);
    }
  }, [session, supabase]);

  useEffect(() => {
    if (!session) {
      return;
    }

    // Admins should listen for ALL event updates, not just their own user_id
    const channel = supabase
      .channel('admin-event-document-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'events',
          // No filter by user_id here, as admins need to see updates from all clients
        },
        handleRealtimeUpdate
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, session, handleRealtimeUpdate]);
};