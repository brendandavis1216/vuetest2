"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useSupabase } from '@/integrations/supabase/SessionContextProvider';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { showSuccess, showError } from '@/utils/toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { FileStack, ArrowLeft, Eye, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import { useAdminEventNotifications } from '@/hooks/useAdminEventNotifications';
import EditEventDialog from '@/components/EditEventDialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Profile {
  id: string;
  school: string | null;
  fraternity: string | null;
  avatar_url: string | null;
  role: string;
  email: string;
  chapter_id: string | null;
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

interface Chapter {
  id: string;
  name: string;
}

const AdminDashboard = () => {
  const { supabase, session } = useSupabase();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loadingAdminStatus, setLoadingAdminStatus] = useState(true);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [loadingChapters, setLoadingChapters] = useState(false);
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
        showSuccess('All profiles loaded successfully!');
      }
    } catch (error: any) {
      console.error('Unexpected error calling edge function:', error.message);
      showError(`An unexpected error occurred: ${error.message}`);
    } finally {
      setLoadingProfiles(false);
    }
  }, [supabase]);

  const fetchAllChapters = useCallback(async () => {
    setLoadingChapters(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-all-chapters');
      if (error) {
        console.error('Error invoking get-all-chapters function:', error.message);
        showError(`Failed to load chapters: ${error.message}`);
        setChapters([]);
      } else if (data) {
        setChapters(data as Chapter[]);
      }
    } catch (error: any) {
      console.error('Unexpected error calling edge function:', error.message);
      showError(`An unexpected error occurred while fetching chapters: ${error.message}`);
    } finally {
      setLoadingChapters(false);
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
        fetchAllChapters();
      }
    }
  }, [isAdmin, loadingAdminStatus, navigate, fetchAllProfiles, fetchAllChapters]);

  const handleViewUserEvents = (user: Profile) => {
    setSelectedUser(user);
    fetchUserEvents(user.id);
  };

  const handleChapterAssignment = async (userId: string, newChapterId: string | null) => {
    try {
      const { error } = await supabase.functions.invoke('update-user-chapter', {
        body: { userId, chapterId: newChapterId },
      });

      if (error) {
        console.error('Error updating user chapter:', error.message);
        showError(`Failed to update user's chapter: ${error.message}`);
      } else {
        showSuccess('User chapter updated successfully!');
        // Optimistically update the profiles state
        setProfiles(prevProfiles =>
          prevProfiles.map(profile =>
            profile.id === userId ? { ...profile, chapter_id: newChapterId } : profile
          )
        );
      }
    } catch (error: any) {
      console.error('Unexpected error calling edge function:', error.message);
      showError(`An unexpected error occurred: ${error.message}`);
    }
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

  if ((loadingProfiles || loadingChapters) && !selectedUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading user profiles and chapters...</p>
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
                  <TableHead className="text-center">Chapter Assignment</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                  <TableHead className="text-right">Chapter Profile</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell>{profile.school || 'N/A'}</TableCell>
                    <TableCell>{profile.fraternity || 'N/A'}</TableCell>
                    <TableCell>{profile.email}</TableCell>
                    <TableCell className="text-center">
                      <Select
                        value={profile.chapter_id || 'unassign-chapter'} {/* Set default value for unassigned */}
                        onValueChange={(value) => handleChapterAssignment(profile.id, value === 'unassign-chapter' ? null : value)}
                        disabled={loadingChapters}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Assign Chapter" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassign-chapter">Unassign Chapter</SelectItem> {/* Changed value */}
                          {chapters.map((chapter) => (
                            <SelectItem key={chapter.id} value={chapter.id}>
                              {chapter.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewUserEvents(profile)}
                      >
                        <Eye className="mr-2 h-4 w-4" /> View Events
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      {profile.chapter_id ? (
                        <Link to={`/admin/chapters/${profile.chapter_id}`}>
                          <Button variant="outline" size="sm">
                            <Building2 className="mr-2 h-4 w-4" /> View Chapter Profile
                          </Button>
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
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
                      <TableHead>Contact Phone</TableHead>
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
                        <TableCell>{event.contact_phone}</TableCell>
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