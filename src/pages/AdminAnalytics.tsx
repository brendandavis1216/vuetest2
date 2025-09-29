"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabase } from '@/integrations/supabase/SessionContextProvider';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BarChart, Users, CalendarDays, DollarSign, FileText } from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';
import { Skeleton } from '@/components/ui/skeleton';
import EventsByArtistStatusChart from '@/components/analytics/EventsByArtistStatusChart';
import ContractStatusPieChart from '@/components/analytics/ContractStatusPieChart';

interface AnalyticsData {
  totalEvents: number;
  totalUsers: number;
  averageBudget: number;
  eventsWithArtist: number;
  eventsWithoutArtist: number; // New field for chart
  signedContractsCount: number; // New field for chart
  pendingContractsCount: number; // New field for chart
  documentsUploaded: number;
}

const AdminAnalytics = () => {
  const { supabase, session } = useSupabase();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingAdminStatus, setLoadingAdminStatus] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalEvents: 0,
    totalUsers: 0,
    averageBudget: 0,
    eventsWithArtist: 0,
    eventsWithoutArtist: 0,
    signedContractsCount: 0,
    pendingContractsCount: 0,
    documentsUploaded: 0,
  });

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

  const fetchAnalyticsData = useCallback(async () => {
    setLoadingData(true);
    try {
      // Fetch total events and related counts
      const { data: allEvents, error: allEventsError } = await supabase
        .from('events')
        .select('budget, artist_name, renders_url, contract_url, invoice_url, equipment_list_url, other_documents_url, signed_contract_url');

      if (allEventsError) throw allEventsError;

      const totalEventsCount = allEvents.length;
      let totalBudget = 0;
      let eventsWithArtistCount = 0;
      let signedContractsCount = 0;
      let totalDocumentsUploaded = 0;

      allEvents.forEach(event => {
        totalBudget += event.budget;
        if (event.artist_name) {
          eventsWithArtistCount++;
        }
        if (event.signed_contract_url) {
          signedContractsCount++;
        }
        // Count uploaded documents for each event
        if (event.renders_url) totalDocumentsUploaded++;
        if (event.contract_url) totalDocumentsUploaded++;
        if (event.invoice_url) totalDocumentsUploaded++;
        if (event.equipment_list_url) totalDocumentsUploaded++;
        if (event.other_documents_url) totalDocumentsUploaded++;
        if (event.signed_contract_url) totalDocumentsUploaded++;
      });

      const eventsWithoutArtist = totalEventsCount - eventsWithArtistCount;
      const pendingContractsCount = totalEventsCount - signedContractsCount;
      const averageBudget = totalEventsCount > 0 ? parseFloat((totalBudget / totalEventsCount).toFixed(2)) : 0;

      // Fetch total users (excluding admins)
      const { data: profilesData, error: profilesError } = await supabase.functions.invoke('get-all-user-profiles');
      if (profilesError) throw profilesError;
      const totalUsersCount = (profilesData as any[]).filter(p => p.role !== 'admin').length;

      setAnalyticsData({
        totalEvents: totalEventsCount,
        totalUsers: totalUsersCount,
        averageBudget: averageBudget,
        eventsWithArtist: eventsWithArtistCount,
        eventsWithoutArtist: eventsWithoutArtist,
        signedContractsCount: signedContractsCount,
        pendingContractsCount: pendingContractsCount,
        documentsUploaded: totalDocumentsUploaded,
      });

    } catch (error: any) {
      console.error('Error fetching analytics data:', error.message);
      showError(`Failed to load analytics data: ${error.message}`);
    } finally {
      setLoadingData(false);
    }
  }, [supabase]);

  useEffect(() => {
    checkAdminStatus();
  }, [checkAdminStatus]);

  useEffect(() => {
    if (!loadingAdminStatus && isAdmin) {
      fetchAnalyticsData();
    } else if (!loadingAdminStatus && !isAdmin) {
      showError('You do not have administrative access to view analytics.');
      navigate('/dashboard', { replace: true });
    }
  }, [isAdmin, loadingAdminStatus, navigate, fetchAnalyticsData]);

  if (loadingAdminStatus || loadingData) {
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
          <BarChart className="h-7 w-7" /> Event Analytics
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalEvents}</div>
            <p className="text-xs text-muted-foreground">Number of events created</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Clients registered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Event Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analyticsData.averageBudget.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Average production budget per event</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events with Artist</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.eventsWithArtist}</div>
            <p className="text-xs text-muted-foreground">Events where an artist is hired</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents Uploaded</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.documentsUploaded}</div>
            <p className="text-xs text-muted-foreground">Across all events and document types</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Events by Artist Engagement</CardTitle>
            <CardDescription>Breakdown of events based on artist hiring status.</CardDescription>
          </CardHeader>
          <CardContent>
            <EventsByArtistStatusChart
              eventsWithArtist={analyticsData.eventsWithArtist}
              eventsWithoutArtist={analyticsData.eventsWithoutArtist}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contract Status Overview</CardTitle>
            <CardDescription>Proportion of events with signed vs. pending contracts.</CardDescription>
          </CardHeader>
          <CardContent>
            <ContractStatusPieChart
              signedContractsCount={analyticsData.signedContractsCount}
              pendingContractsCount={analyticsData.pendingContractsCount}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAnalytics;