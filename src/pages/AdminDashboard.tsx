"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useSupabase } from '@/integrations/supabase/SessionContextProvider';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { showSuccess, showError } from '@/utils/toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { FileStack, ArrowLeft, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { useAdminEventNotifications } from '@/hooks/useAdminEventNotifications';
import EditEventDialog from '@/components/EditEventDialog';

interface Profile {
  id: string;
  school: string | null;
  fraternity: string | null;
  avatar_url: string | null;
  role: string;
  email: string;
  totalEvents: number; // New field
  averageBudget: number; // New field
  signedContractsCount: number; // New field
  lastEventDate: string | null; // New field
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

const AdminDashboard = () => {
  const { supabase, session } = useSupabase();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loadingAdminStatus, setLoadingAdminStatus] = useState(true);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [userEvents, setUserEvents] = useState<Event[]>([]);
  const [loadingUserEvents, setLoadingUserEvents] = useState(false);

  useAdminEventNotifications();

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

  const fetchAllProfiles = useCallback(async () => {
    setLoadingProfiles(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-all-user-profiles');

      if (error) {
        console.error('Error invoking get-all-user-profiles function:', error.message);
        showError(`Failed to load all user profiles: ${error.message}`);
        setProfiles([]);
      } else if (data) {
        const filteredProfiles = (data as Profile[]).filter(profile => profile.role !== 'admin');
        setProfiles(filteredProfiles);
        console.log('Fetched profiles with analytics:', filteredProfiles); // Debug log
        showSuccess('All profiles loaded successfully!');
      }
    } catch (error: any) {
      console.error('Unexpected error calling edge function:', error.message);
      showError(`An unexpected error occurred: ${error.message}`);
    } finally {
      setLoadingProfiles(false);
    }
  }, [supabase]);

  const fetchUserEvents = useCallback(async (userId: string) => {
    setLoadingUserEvents(true);
    const { data, error } = await supabase
      .from('events')
      .select('*, renders_url, contract_url, invoice_url, equipment_list_url, other_documents_url, signed_contract_url')
      .eq('user_id', userId)
      .order('event_date', { ascending: true });

    if (error) {
      console.error('Error fetching user events:', error.message);
      showError('Failed to load user events.');
      setUserEvents([]);
    } else if (data) {
      setUserEvents(data as Event[]);
    }
    setLoadingUserEvents(false);
  }, [supabase]);

  useEffect(() => {
    checkAdminStatus();
  }, [checkAdminStatus]);

  useEffect(() => {
    if (!loadingAdminStatus) {
      if (!isAdmin) {
        showError('You do not have administrative access.');
        navigate('/dashboard', { replace: true });
      } else {
        fetchAllProfiles();
      }
    }
  }, [isAdmin, loadingAdminStatus, navigate, fetchAllProfiles]);

  const handleViewUserEvents = (user: Profile) => {
    setSelectedUser(user);
    fetchUserEvents(user.id);
  };

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

  if (loadingAdminStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading admin status...</p>
      </div>
    );
  }

  if (loadingProfiles && !selectedUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading user profiles...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Link to="/admin/event-documents">
          <Button>
            <FileStack className="mr-2 h-4 w-4" /> Manage Event Documents
          </Button>
        </Link>
      </div>

      {!selectedUser ? (
        <Card>
          <CardHeader>
            <CardTitle>All User Profiles</CardTitle>
            <CardDescription>View user roles and their associated events.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>School</TableHead>
                  <TableHead>Fraternity</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Actions</TableHead> {/* Changed column header */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell>{profile.school || 'N/A'}</TableCell>
                    <TableCell>{profile.fraternity || 'N/A'}</TableCell>
                    <TableCell>{profile.email}</TableCell>
                    <TableCell className="text-right">
                      <Link to={`/admin/clients/${profile.id}`}> {/* Link to new client profile page */}
                        <Button variant="outline" size="sm">
                          <Eye className="mr-2 h-4 w-4" /> View Client Profile
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-6">
            <Button variant="outline" onClick={() => setSelectedUser(null)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to All Users
            </Button>
            <h2 className="text-2xl font-bold">Events for: {selectedUser.school} {selectedUser.fraternity} ({selectedUser.email})</h2>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>User's Events</CardTitle>
              <CardDescription>All events created by this user.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingUserEvents ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : userEvents.length === 0 ? (
                <p className="text-muted-foreground">This user has not created any events yet.</p>
              ) : (
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
                    {userEvents.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell className="font-medium">{event.event_name || 'Untitled Event'}</TableCell>
                        <TableCell>{format(new Date(event.event_date), 'PPP')}</TableCell>
                        <TableCell>{event.artist_name || 'N/A'}</TableCell>
                        <TableCell>${event.budget.toLocaleString()}</TableCell>
                        <TableCell>{calculateCompletionPercentage(event)}%</TableCell>
                        <TableCell className="text-center">
                          <Link to={`/events/${event.id}`}>
                            <Button variant="outline" size="sm">
                              View Documents
                            </Button>
                          </Link>
                        </TableCell>
                        <TableCell className="text-center">
                          <EditEventDialog event={event} onEventUpdated={fetchUserEvents.bind(null, selectedUser.id)} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;