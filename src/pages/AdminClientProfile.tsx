"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSupabase } from '@/integrations/supabase/SessionContextProvider';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, CalendarDays, DollarSign, FileText, CheckCircle2 } from 'lucide-react';
import { showError } from '@/utils/toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import EditEventDialog from '@/components/EditEventDialog';

interface Profile {
  id: string;
  school: string | null;
  fraternity: string | null;
  avatar_url: string | null;
  role: string;
  email: string;
  totalEvents: number;
  averageBudget: number;
  signedContractsCount: number;
  lastEventDate: string | null;
}

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

const AdminClientProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { supabase, session } = useSupabase();
  const [clientProfile, setClientProfile] = useState<Profile | null>(null);
  const [clientEvents, setClientEvents] = useState<Event[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
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
      showError('Failed to verify admin status.');
      setIsAdmin(false);
    } else {
      setIsAdmin(data);
    }
    setLoadingAdminStatus(false);
  }, [session, supabase]);

  const fetchClientData = useCallback(async () => {
    if (!userId) {
      showError('Client ID missing.');
      navigate('/admin', { replace: true });
      return;
    }

    setLoadingProfile(true);
    setLoadingEvents(true);

    try {
      // Fetch all profiles with analytics using the edge function
      const { data: allProfiles, error: profilesError } = await supabase.functions.invoke('get-all-user-profiles');

      if (profilesError) {
        throw new Error(profilesError.message);
      }

      const targetProfile = (allProfiles as Profile[]).find(p => p.id === userId);

      if (!targetProfile) {
        showError('Client profile not found.');
        navigate('/admin', { replace: true });
        return;
      }
      setClientProfile(targetProfile);

      // Fetch specific events for this user
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*, renders_url, contract_url, invoice_url, equipment_list_url, other_documents_url, signed_contract_url')
        .eq('user_id', userId)
        .order('event_date', { ascending: true });

      if (eventsError) {
        throw new Error(eventsError.message);
      }
      setClientEvents(eventsData as Event[]);

    } catch (error: any) {
      console.error('Error fetching client data:', error.message);
      showError(`Failed to load client data: ${error.message}`);
      navigate('/admin', { replace: true });
    } finally {
      setLoadingProfile(false);
      setLoadingEvents(false);
    }
  }, [userId, supabase, navigate]);

  useEffect(() => {
    checkAdminStatus();
  }, [checkAdminStatus]);

  useEffect(() => {
    if (!loadingAdminStatus) {
      if (!isAdmin) {
        showError('You do not have administrative access to view client profiles.');
        navigate('/dashboard', { replace: true });
      } else {
        fetchClientData();
      }
    }
  }, [isAdmin, loadingAdminStatus, navigate, fetchClientData]);

  const calculateCompletionPercentage = (event: Event) => {
    const documentFields = [
      event.renders_url,
      event.contract_url,
      event.invoice_url,
      event.equipment_list_url,
      event.other_documents_url,
      event.signed_contract_url,
    ];
    const uploadedCount = documentFields.filter(url => url !== null).length;
    const totalCategories = documentFields.length;
    return totalCategories > 0 ? Math.round((uploadedCount / totalCategories) * 100) : 0;
  };

  if (loadingAdminStatus || loadingProfile || loadingEvents) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Skeleton className="h-[300px] w-full max-w-4xl" />
      </div>
    );
  }

  if (!clientProfile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold mb-4 text-foreground">Client Not Found</h2>
        <p className="text-muted-foreground mb-6">The client profile you are looking for does not exist or you do not have permission to view it.</p>
        <Button onClick={() => navigate('/admin')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Admin Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <Button variant="outline" onClick={() => navigate('/admin')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Admin Dashboard
        </Button>
        <h1 className="text-4xl font-bold text-foreground text-center sm:text-left">
          Client Profile: {clientProfile.school} {clientProfile.fraternity}
        </h1>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Client Details</CardTitle>
          <CardDescription>Overview of the client's profile and activity.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Email</p>
            <p className="text-lg font-semibold">{clientProfile.email}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">School</p>
            <p className="text-lg font-semibold">{clientProfile.school || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Fraternity</p>
            <p className="text-lg font-semibold">{clientProfile.fraternity || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Events Booked</p>
            <p className="text-lg font-semibold flex items-center gap-1">
              <CalendarDays className="h-5 w-5 text-muted-foreground" /> {clientProfile.totalEvents}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Average Event Budget</p>
            <p className="text-lg font-semibold flex items-center gap-1">
              <DollarSign className="h-5 w-5 text-muted-foreground" /> ${clientProfile.averageBudget.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Signed Contracts</p>
            <p className="text-lg font-semibold flex items-center gap-1">
              <CheckCircle2 className="h-5 w-5 text-green-500" /> {clientProfile.signedContractsCount}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Last Event Date</p>
            <p className="text-lg font-semibold">
              {clientProfile.lastEventDate ? format(new Date(clientProfile.lastEventDate), 'PPP') : 'N/A'}
            </p>
          </div>
        </CardContent>
      </Card>

      <h2 className="text-3xl font-bold mt-8 mb-4 text-foreground">Client's Events</h2>
      <Card>
        <CardHeader>
          <CardTitle>All Events by This Client</CardTitle>
          <CardDescription>A list of all events created by {clientProfile.school} {clientProfile.fraternity}.</CardDescription>
        </CardHeader>
        <CardContent>
          {clientEvents.length === 0 ? (
            <p className="text-muted-foreground">This client has not created any events yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event Name/Theme</TableHead>
                    <TableHead>Event Date</TableHead>
                    <TableHead>Artist Name</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Completion</TableHead>
                    <TableHead className="text-center min-w-[120px]">View Documents</TableHead>
                    <TableHead className="text-center min-w-[80px]">Edit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">{event.event_name || 'Untitled Event'}</TableCell>
                      <TableCell>{format(new Date(event.event_date), 'PPP')}</TableCell>
                      <TableCell>{event.artist_name || 'N/A'}</TableCell>
                      <TableCell>${event.budget.toLocaleString()}</TableCell>
                      <TableCell>{calculateCompletionPercentage(event)}%</TableCell>
                      <TableCell className="text-center">
                        <Button variant="outline" size="sm" onClick={() => navigate(`/events/${event.id}`)}>
                          View Documents
                        </Button>
                      </TableCell>
                      <TableCell className="text-center">
                        <EditEventDialog event={event} onEventUpdated={fetchClientData} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminClientProfile;