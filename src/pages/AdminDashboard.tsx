"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useSupabase } from '@/integrations/supabase/SessionContextProvider';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { showSuccess, showError } from '@/utils/toast';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  role: string;
  email: string; // Assuming email can be fetched or joined
}

const AdminDashboard = () => {
  const { supabase, session } = useSupabase();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const checkAdminStatus = useCallback(async () => {
    if (!session) {
      setIsAdmin(false);
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
  }, [session, supabase]);

  const fetchAllProfiles = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, avatar_url, role, auth_users:id(email)'); // Join with auth.users for email

    if (error) {
      console.error('Error fetching all profiles:', error.message);
      showError('Failed to load all user profiles.');
      setProfiles([]);
    } else if (data) {
      const profilesWithEmail = data.map(p => ({
        ...p,
        email: p.auth_users?.email || 'N/A' // Extract email from joined data
      }));
      setProfiles(profilesWithEmail);
      showSuccess('All profiles loaded successfully!');
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    checkAdminStatus();
  }, [checkAdminStatus]);

  useEffect(() => {
    if (!loading && !isAdmin) {
      showError('You do not have administrative access.');
      navigate('/dashboard', { replace: true }); // Redirect non-admins
    } else if (isAdmin) {
      fetchAllProfiles();
    }
  }, [isAdmin, loading, navigate, fetchAllProfiles]);

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>{loading ? 'Loading admin status...' : 'Redirecting...'}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <Card>
        <CardHeader>
          <CardTitle>All User Profiles</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>First Name</TableHead>
                  <TableHead>Last Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell className="font-medium">{profile.id.substring(0, 8)}...</TableCell>
                    <TableCell>{profile.first_name || 'N/A'}</TableCell>
                    <TableCell>{profile.last_name || 'N/A'}</TableCell>
                    <TableCell>{profile.email}</TableCell>
                    <TableCell>{profile.role}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;