"use client";

import { useEffect, useCallback } from 'react';
import { useSupabase } from '@/integrations/supabase/SessionContextProvider';
import { showSuccess } from '@/utils/toast';

interface EventUpdatePayload {
  old: {
    id: string;
    event_name: string | null;
    renders_url: string | null;
    contract_url: string | null;
    invoice_url: string | null;
    equipment_list_url: string | null;
    other_documents_url: string | null;
    signed_contract_url: string | null; // New field
    user_id: string;
    // ... other fields
  };
  new: {
    id: string;
    event_name: string | null;
    renders_url: string | null;
    contract_url: string | null;
    invoice_url: string | null;
    equipment_list_url: string | null;
    other_documents_url: string | null;
    signed_contract_url: string | null; // New field
    user_id: string;
    // ... other fields
  };
}

const documentTypesMap: { [key: string]: string } = {
  renders_url: 'Renders',
  contract_url: 'Contract',
  invoice_url: 'Invoice',
  equipment_list_url: 'Equipment List',
  other_documents_url: 'Other Documents',
  signed_contract_url: 'Signed Contract', // New document type
};

export const useEventNotifications = () => {
  const { supabase, session } = useSupabase();

  const handleRealtimeUpdate = useCallback((payload: { new: any; old: any }) => {
    const { old, new: updatedEvent } = payload as EventUpdatePayload;

    if (!session?.user.id || updatedEvent.user_id !== session.user.id) {
      // Only notify the owner of the event
      return;
    }

    let notificationMessage = '';
    const eventName = updatedEvent.event_name || 'Your Event';

    for (const key in documentTypesMap) {
      if (old[key as keyof EventUpdatePayload['old']] !== updatedEvent[key as keyof EventUpdatePayload['new']] && updatedEvent[key as keyof EventUpdatePayload['new']]) {
        // A document URL has changed and is now present (i.e., uploaded or updated)
        // We only want to notify the client if an admin uploaded something *for them*.
        // If the client uploads their own signed contract, they don't need a notification.
        // This hook is specifically for admin-to-client notifications.
        if (key !== 'signed_contract_url') { // Exclude self-uploaded signed contract from client notifications
          notificationMessage = `An admin has uploaded a new ${documentTypesMap[key]} for "${eventName}"!`;
          break; // Only show one notification per update, for the first detected change
        }
      }
    }

    if (notificationMessage) {
      showSuccess(notificationMessage);
    }
  }, [session]);

  useEffect(() => {
    if (!session) {
      // No session, no need to subscribe
      return;
    }

    // Subscribe to changes in the 'events' table
    const channel = supabase
      .channel('event-document-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'events',
          filter: `user_id=eq.${session.user.id}`, // Only listen for updates to the current user's events
        },
        handleRealtimeUpdate
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, session, handleRealtimeUpdate]);
};