"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSupabase } from '@/integrations/supabase/SessionContextProvider';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, DollarSign, Percent, Users, CalendarDays } from 'lucide-react';
import { showError } from '@/utils/toast';
import { Skeleton } from '@/components/ui/skeleton';

interface ChapterAnalytics {
  chapter_name: string;
  total_members: number;
  total_events: number;
  average_budget: number;
  ltv: number; // Lifetime Value (placeholder)
  close_percentage: number; // Event Close Percentage (placeholder)
}

const AdminChapterProfile = () => {
  const { chapterId } = useParams<{ chapterId: string }>();
  const navigate = useNavigate();
  const { supabase, session } = useSupabase();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingAdminStatus, setLoadingAdminStatus] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<ChapterAnalytics | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

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

  const fetchChapterAnalytics = useCallback(async () => {
    if (!chapterId) {
      showError('Chapter ID missing.');
      navigate('/admin', { replace: true });
      return;
    }

    setLoadingAnalytics(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-chapter-analytics', {
        body: { chapterId },
      });

      if (error) {
        console.error('Error invoking get-chapter-analytics function:', error.message);
        showError(`Failed to load chapter analytics: ${error.message}`);
        setAnalyticsData(null);
      } else if (data) {
        setAnalyticsData(data as ChapterAnalytics);
      }
    } catch (error: any) {
      console.error('Unexpected error calling edge function:', error.message);
      showError(`An unexpected error occurred: ${error.message}`);
    } finally {
      setLoadingAnalytics(false);
    }
  }, [chapterId, navigate, supabase]);

  useEffect(() => {
    checkAdminStatus();
  }, [checkAdminStatus]);

  useEffect(() => {
    if (!loadingAdminStatus) {
      if (!isAdmin) {
        showError('You do not have administrative access to view chapter profiles.');
        navigate('/dashboard', { replace: true });
      } else {
        fetchChapterAnalytics();
      }
    }
  }, [isAdmin, loadingAdminStatus, navigate, fetchChapterAnalytics]);

  if (loadingAdminStatus || loadingAnalytics) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Skeleton className="h-[300px] w-full max-w-4xl" />
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold mb-4 text-foreground">Chapter Profile Not Found</h2>
        <p className="text-muted-foreground mb-6">The chapter you are looking for does not exist or data could not be loaded.</p>
        <Button onClick={() => navigate('/admin')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Admin Dashboard
        </Button>
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
          <Users className="h-7 w-7" /> Chapter Profile: {analyticsData.chapter_name}
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.total_members}</div>
            <p className="text-xs text-muted-foreground">Profiles associated with this chapter</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.total_events}</div>
            <p className="text-xs text-muted-foreground">Events created by chapter members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Event Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analyticsData.average_budget.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Average budget across chapter events</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lifetime Value (LTV)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analyticsData.ltv.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Estimated total value from this chapter</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Close Percentage</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.close_percentage}%</div>
            <p className="text-xs text-muted-foreground">Percentage of events successfully closed</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Detailed Reports (Coming Soon)</CardTitle>
          <CardDescription>Placeholder for charts, graphs, and more in-depth analysis specific to this chapter.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">This section will feature interactive charts and detailed breakdowns of event data, user activity, and document management for {analyticsData.chapter_name}.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminChapterProfile;