"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabase } from '@/integrations/supabase/SessionContextProvider';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { showError } from '@/utils/toast';
import { Skeleton } from '@/components/ui/skeleton';

// Import new modular components and hook
import { useLeadsData } from '@/hooks/useLeadsData';
import AddLeadDialog from '@/components/leads/AddLeadDialog';
import ImportLeadsDialog from '@/components/leads/ImportLeadsDialog';
import LeadTable from '@/components/leads/LeadTable';

const LeadDatabase = () => {
  const { supabase, session } = useSupabase();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingAdminStatus, setLoadingAdminStatus] = useState(true);

  const {
    filteredLeads,
    loadingLeads,
    searchQuery,
    setSearchQuery,
    fetchLeads,
    handleUpdateLeadStatus,
  } = useLeadsData({ isAdmin, sessionUserId: session?.user.id });

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

  useEffect(() => {
    checkAdminStatus();
  }, [checkAdminStatus]);

  useEffect(() => {
    if (!loadingAdminStatus) {
      if (!isAdmin) {
        showError('You do not have administrative access to view the lead database.');
        navigate('/dashboard', { replace: true });
      } else {
        fetchLeads(); // Fetch leads only if admin and status is loaded
      }
    }
  }, [isAdmin, loadingAdminStatus, navigate, fetchLeads]);

  if (loadingAdminStatus || loadingLeads) {
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
          <>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Admin Dashboard
          </>
        </Button>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <UserPlus className="h-7 w-7" /> Lead Database
        </h1>
        <div className="flex gap-2">
          <ImportLeadsDialog onLeadsImported={fetchLeads} />
          <AddLeadDialog onLeadAdded={fetchLeads} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Leads</CardTitle>
          <CardDescription>Manage potential clients and track their status.</CardDescription>
        </CardHeader>
        <CardContent>
          <LeadTable
            leads={filteredLeads}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onUpdateLeadStatus={handleUpdateLeadStatus}
            loading={loadingLeads}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default LeadDatabase;