"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useSupabase } from '@/integrations/supabase/SessionContextProvider';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { showSuccess, showError } from '@/utils/toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Eye, Search } from 'lucide-react'; // Removed FileStack
import { Input } from '@/components/ui/input';
import { useAdminEventNotifications } from '@/hooks/useAdminEventNotifications';

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
  ltv: number;
}

const AdminDashboard = () => {
  const { supabase, session } = useSupabase();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingAdminStatus, setLoadingAdminStatus] = useState(true);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

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
        setFilteredProfiles([]);
      } else if (data) {
        const filtered = (data as Profile[]).filter(profile => profile.role !== 'admin');
        setProfiles(filtered);
        setFilteredProfiles(filtered);
        showSuccess('All client profiles loaded successfully!');
      }
    } catch (error: any) {
      console.error('Unexpected error calling edge function:', error.message);
      showError(`An unexpected error occurred: ${error.message}`);
    } finally {
      setLoadingProfiles(false);
    }
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

  useEffect(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    const results = profiles.filter(profile =>
      profile.school?.toLowerCase().includes(lowerCaseQuery) ||
      profile.fraternity?.toLowerCase().includes(lowerCaseQuery) ||
      profile.email.toLowerCase().includes(lowerCaseQuery)
    );
    setFilteredProfiles(results);
  }, [searchQuery, profiles]);

  if (loadingAdminStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading admin status...</p>
      </div>
    );
  }

  if (loadingProfiles) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading client profiles...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex gap-4">
          {/* Removed the "Manage Event Documents" button */}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Client Profiles</CardTitle>
          <CardDescription>View and manage all registered client accounts.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients by school, fraternity, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>School</TableHead>
                <TableHead>Fraternity</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProfiles.length === 0 && searchQuery !== '' ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                    No clients found matching your search.
                  </TableCell>
                </TableRow>
              ) : filteredProfiles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                    No client profiles available.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProfiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell>{profile.school || 'N/A'}</TableCell>
                    <TableCell>{profile.fraternity || 'N/A'}</TableCell>
                    <TableCell>{profile.email}</TableCell>
                    <TableCell className="text-right">
                      <Link to={`/admin/clients/${profile.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="mr-2 h-4 w-4" /> View Profile
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;