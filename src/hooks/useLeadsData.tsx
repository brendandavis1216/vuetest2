"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '@/integrations/supabase/SessionContextProvider';
import { showError, showSuccess } from '@/utils/toast';
import { Lead } from '@/types/lead';

interface UseLeadsDataProps {
  isAdmin: boolean;
  sessionUserId: string | undefined;
}

export const useLeadsData = ({ isAdmin, sessionUserId }: UseLeadsDataProps) => {
  const { supabase } = useSupabase();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLeads = useCallback(async () => {
    if (!isAdmin) {
      setLoadingLeads(false);
      return;
    }

    setLoadingLeads(true);
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching leads:', error.message);
      showError('Failed to load leads.');
      setLeads([]);
      setFilteredLeads([]);
    } else if (data) {
      setLeads(data as Lead[]);
      setFilteredLeads(data as Lead[]);
    }
    setLoadingLeads(false);
  }, [isAdmin, supabase]);

  useEffect(() => {
    if (isAdmin) {
      fetchLeads();
    }
  }, [isAdmin, fetchLeads]);

  useEffect(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    const results = leads.filter(lead =>
      lead.school.toLowerCase().includes(lowerCaseQuery) ||
      lead.fraternity.toLowerCase().includes(lowerCaseQuery) ||
      lead.contact_phone.toLowerCase().includes(lowerCaseQuery) ||
      (lead.instagram_handle && lead.instagram_handle.toLowerCase().includes(lowerCaseQuery)) ||
      (lead.contact_name && lead.contact_name.toLowerCase().includes(lowerCaseQuery)) ||
      lead.status.toLowerCase().includes(lowerCaseQuery)
    );
    setFilteredLeads(results);
  }, [searchQuery, leads]);

  const handleUpdateLeadStatus = useCallback(async (leadId: string, newStatus: Lead['status']) => {
    if (!sessionUserId) {
      showError('You must be logged in to update a lead.');
      return;
    }

    const { error } = await supabase
      .from('leads')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', leadId);

    if (error) {
      console.error('Error updating lead status:', error.message);
      showError(`Failed to update lead status: ${error.message}`);
    } else {
      showSuccess('Lead status updated successfully!');
      fetchLeads(); // Refresh the list of leads
    }
  }, [sessionUserId, supabase, fetchLeads]);

  return {
    leads,
    filteredLeads,
    loadingLeads,
    searchQuery,
    setSearchQuery,
    fetchLeads,
    handleUpdateLeadStatus,
  };
};