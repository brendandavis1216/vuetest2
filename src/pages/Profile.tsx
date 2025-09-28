"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useSupabase } from '@/integrations/supabase/SessionContextProvider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { showSuccess, showError } from '@/utils/toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from 'lucide-react';

interface Profile {
  id: string;
  school: string | null; // Changed from first_name
  fraternity: string | null; // Changed from last_name
  avatar_url: string | null;
  role: string;
}

const ProfilePage = () => {
  const { supabase, session } = useSupabase();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [school, setSchool] = useState(''); // Changed from firstName
  const [fraternity, setFraternity] = useState(''); // Changed from lastName
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const getProfile = useCallback(async () => {
    if (!session?.user.id) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('school, fraternity, avatar_url, role') // Select new fields
      .eq('id', session.user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error.message);
      showError('Failed to load profile.');
    } else if (data) {
      setProfile(data);
      setSchool(data.school || ''); // Set new state
      setFraternity(data.fraternity || ''); // Set new state
      if (data.avatar_url) {
        const { data: publicUrlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(data.avatar_url);
        setAvatarUrl(publicUrlData.publicUrl);
      } else {
        setAvatarUrl(null);
      }
    }
    setLoading(false);
  }, [session, supabase]);

  useEffect(() => {
    getProfile();
  }, [getProfile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user.id) {
      console.warn('No user session found, cannot update profile.');
      return;
    }

    setLoading(true);
    console.log('Attempting to update profile for user:', session.user.id);
    console.log('Sending data:', { school: school, fraternity: fraternity }); // Log new fields

    const { error } = await supabase
      .from('profiles')
      .update({ school: school, fraternity: fraternity, updated_at: new Date().toISOString() }) // Update new fields
      .eq('id', session.user.id);

    if (error) {
      console.error('Error updating profile:', error.message);
      showError(`Failed to update profile: ${error.message}`);
    } else {
      setProfile(prev => prev ? { ...prev, school: school, fraternity: fraternity } : null); // Update state with new fields
      showSuccess('Profile updated successfully!');
      console.log('Profile updated successfully!');
    }
    setLoading(false);
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!session?.user.id || !event.target.files || event.target.files.length === 0) {
      console.warn('No user session or file selected for avatar upload.');
      return;
    }

    setUploading(true);
    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${session.user.id}-${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    console.log('Attempting to upload avatar to path:', filePath);

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error('Error uploading avatar:', uploadError.message);
      showError(`Failed to upload avatar: ${uploadError.message}`);
      setUploading(false);
      return;
    }

    console.log('Avatar uploaded successfully, updating profile avatar_url...');
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: filePath, updated_at: new Date().toISOString() })
      .eq('id', session.user.id);

    if (updateError) {
      console.error('Error updating avatar URL in profile:', updateError.message);
      showError(`Failed to update avatar URL: ${updateError.message}`);
    } else {
      showSuccess('Avatar uploaded successfully!');
      getProfile(); // Re-fetch profile to get the new avatar URL
      console.log('Profile avatar_url updated successfully!');
    }
    setUploading(false);
  };

  const handleSignOut = async () => {
    console.log('Attempting to sign out...');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error.message);
      showError('Failed to sign out.');
    } else {
      showSuccess('Signed out successfully!');
      console.log('Signed out successfully!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>User Profile</CardTitle>
          <CardDescription>Manage your profile information and avatar.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center mb-6">
            <Avatar className="w-24 h-24 mb-4">
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt="User Avatar" />
              ) : (
                <AvatarFallback>
                  <User className="h-12 w-12 text-gray-500" />
                </AvatarFallback>
              )}
            </Avatar>
            <Label htmlFor="avatar-upload" className="cursor-pointer text-blue-600 hover:underline">
              {uploading ? 'Uploading...' : 'Upload Avatar'}
            </Label>
            <Input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
              disabled={uploading}
            />
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={session?.user.email || ''} disabled />
            </div>
            <div>
              <Label htmlFor="school">School</Label> {/* New Label */}
              <Input
                id="school"
                type="text"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                disabled={loading || uploading}
              />
            </div>
            <div>
              <Label htmlFor="fraternity">Fraternity</Label> {/* New Label */}
              <Input
                id="fraternity"
                type="text"
                value={fraternity}
                onChange={(e) => setFraternity(e.target.value)}
                disabled={loading || uploading}
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Input id="role" type="text" value={profile?.role || 'client'} disabled />
            </div>
            <Button type="submit" className="w-full" disabled={loading || uploading}>
              {loading ? 'Updating...' : 'Update Profile'}
            </Button>
          </form>
          <Button variant="outline" className="w-full mt-4" onClick={handleSignOut} disabled={loading || uploading}>
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;