"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useSupabase } from '@/integrations/supabase/SessionContextProvider';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { showSuccess, showError } from '@/utils/toast';
import { useNavigate, Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FileStack, ArrowLeft, Eye } from 'lucide-react'; // Added ArrowLeft and Eye icons
import { format } from 'date-fns';

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  role: string;
  email: string;
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
}

const AdminDashboard = () => {
  const { supabase, session } = useSupabase();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loadingAdminStatus, setLoadingAdminStatus] = useState(true);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isUpdatingRole, setIsUpdatingRole] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null); // State for selected user
  const [userEvents, setUserEvents] = useState<Event[]>([]); // State for selected user's events
  const [loadingUserEvents, setLoadingUserEvents] = useState(false);

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
    // Changed 'auth_users:id(email)' to 'users(email)' for better Supabase relationship inference
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, avatar_url, role, users(email)');

    if (error) {
      console.error('Error fetching all profiles:', error.message);
      showError('Failed to load all user profiles.');
      setProfiles([]);
    } else if (data) {
      console.log("Fetched profiles data:", data); // Log the raw data for debugging
      const profilesWithEmail = data.map(p => ({
        ...p,
        // Access email from the 'users' object
        email: (p.users as { email: string } | null)?.email || 'N/A'
      }));
      setProfiles(profilesWithEmail);
      showSuccess('All profiles loaded successfully!');
    }
    setLoadingProfiles(false);
  }, [supabase]);

  const fetchUserEvents = useCallback(async (userId: string) => {
    setLoadingUserEvents(true);
    const { data, error } = await supabase
      .from('events')
      .select('*')
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

  const handleRoleChange = async (userId: string, newRole: string) => {
    setIsUpdatingRole(userId);
    try {
      const { data, error } = await supabase.functions.invoke('update-user-role', {
        body: { userId, newRole },
      });

      if (error) {
        console.error('Error invoking update-user-role function:', error.message);
        showError(`Failed to update role: ${error.message}`);
      } else if (data && data.error) {
        console.error('Error from update-user-role function:', data.error);
        showError(`Failed to update role: ${data.error}`);
      } else {
        showSuccess('User role updated successfully!');
        setProfiles(prevProfiles =>
          prevProfiles.map(p => (p.id === userId ? { ...p, role: newRole } : p))
        );
      }
    } catch (error: any) {
      console.error('Unexpected error calling edge function:', error.message);
      showError(`An unexpected error occurred: ${error.message}`);
    } finally {
      setIsUpdatingRole(null);
    }
  };

  const handleViewUserEvents = (user: Profile) => {
    setSelectedUser(user);
    fetchUserEvents(user.id);
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
            <CardDescription>Manage user roles and view their associated events.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>First Name</TableHead>
                  <TableHead>Last Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell className="font-medium">{profile.id.substring(0, 8)}...</TableCell>
                    <TableCell>{profile.first_name || 'N/A'}</TableCell>
                    <TableCell>{profile.last_name || 'N/A'}</TableCell>
                    <TableCell>{profile.email}</TableCell>
                    <TableCell>
                      <Select
                        value={profile.role}
                        onValueChange={(newRole) => handleRoleChange(profile.id, newRole)}
                        disabled={isUpdatingRole === profile.id}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder="Select Role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="client">Client</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewUserEvents(profile)}
                        disabled={isUpdatingRole === profile.id}
                      >
                        <Eye className="mr-2 h-4 w-4" /> View Events
                      </Button>
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
            <h2 className="text-2xl font-bold">Events for: {selectedUser.first_name} {selectedUser.last_name} ({selectedUser.email})</h2>
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
                      <TableHead>Contact Phone</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userEvents.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell className="font-medium">{event.event_name || 'Untitled Event'}</TableCell>
                        <TableCell>{format(new Date(event.event_date), 'PPP')}</TableCell>
                        <TableCell>{event.artist_name || 'N/A'}</TableCell>
                        <TableCell>${event.budget.toLocaleString()}</TableCell>
                        <TableCell>{event.contact_phone}</TableCell>
                        <TableCell className="text-right">
                          <Link to={`/events/${event.id}`}>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View Event Details</span>
                            </Button>
                          </Link>
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