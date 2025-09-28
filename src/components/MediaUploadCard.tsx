"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSupabase } from '@/integrations/supabase/SessionContextProvider';
import { showError, showSuccess } from '@/utils/toast';
import { Upload, Image, Video, Trash2, Download } from 'lucide-react';

interface MediaItem {
  id: string;
  url: string;
  type: string; // 'image' or 'video'
  created_at: string;
}

interface MediaUploadCardProps {
  eventId: string;
  mediaItem?: MediaItem; // Optional, for displaying existing media
  onMediaUpdated: () => void;
  readOnly?: boolean;
}

const MediaUploadCard: React.FC<MediaUploadCardProps> = ({
  eventId,
  mediaItem,
  onMediaUpdated,
  readOnly = false,
}) => {
  const { supabase, session } = useSupabase();
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly || !session?.user.id || !event.target.files || event.target.files.length === 0) {
      showError('No user session, file selected, or action is read-only.');
      return;
    }

    setUploading(true);
    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileType = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'other';
    const filePath = `${eventId}/${fileType}-${Date.now()}.${fileExt}`;

    console.log(`[Media Upload] Attempting to upload file: ${file.name}`);
    console.log(`[Media Upload] Target filePath in storage: ${filePath}`);

    const { error: uploadError } = await supabase.storage
      .from('event-media')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false, // Do not upsert, create new entries
      });

    if (uploadError) {
      console.error(`[Media Upload] Error uploading media:`, uploadError.message);
      showError(`Failed to upload media: ${uploadError.message}`);
      setUploading(false);
      return;
    }

    console.log(`[Media Upload] File uploaded successfully. Getting public URL.`);
    const { data: publicUrlData } = supabase.storage
      .from('event-media')
      .getPublicUrl(filePath);

    console.log(`[Media Upload] Generated public URL: ${publicUrlData.publicUrl}`);

    // Insert into public.media table
    const { error: insertError } = await supabase
      .from('media')
      .insert({
        event_id: eventId,
        url: publicUrlData.publicUrl,
        type: fileType,
        uploaded_by: session.user.id,
      });

    if (insertError) {
      console.error(`[Media Upload] Error inserting media record:`, insertError.message);
      showError(`Failed to link media to event: ${insertError.message}`);
    } else {
      showSuccess('Media uploaded and linked successfully!');
      onMediaUpdated();
      console.log(`[Media Upload] Media record inserted successfully.`);
    }
    setUploading(false);
  };

  const handleDeleteMedia = async () => {
    if (readOnly || !mediaItem) {
      showError('No media to delete or action is read-only.');
      return;
    }

    setUploading(true); // Using uploading state for deletion too
    // Extract the file path within the bucket from the public URL
    const urlParts = mediaItem.url.split('/public/event-media/');
    const filePathInBucket = urlParts.length > 1 ? urlParts[1] : '';

    if (!filePathInBucket) {
      showError('Could not determine file path for deletion.');
      setUploading(false);
      return;
    }

    console.log(`[Media Delete] Attempting to delete file from storage path: ${filePathInBucket}`);

    const { error: deleteStorageError } = await supabase.storage
      .from('event-media')
      .remove([filePathInBucket]);

    if (deleteStorageError) {
      console.error(`[Media Delete] Error deleting media from storage:`, deleteStorageError.message);
      showError(`Failed to delete media file: ${deleteStorageError.message}`);
      setUploading(false);
      return;
    }

    console.log(`[Media Delete] Deleting media record from database: ${mediaItem.id}`);
    const { error: deleteDbError } = await supabase
      .from('media')
      .delete()
      .eq('id', mediaItem.id);

    if (deleteDbError) {
      console.error(`[Media Delete] Error deleting media record from database:`, deleteDbError.message);
      showError(`Failed to delete media record: ${deleteDbError.message}`);
    } else {
      showSuccess('Media deleted successfully!');
      onMediaUpdated();
      console.log(`[Media Delete] Media record and file deleted successfully.`);
    }
    setUploading(false);
  };

  const handleDownload = async () => {
    if (!mediaItem?.url) {
      showError('No media available to download.');
      return;
    }

    setDownloading(true);
    try {
      const urlParts = mediaItem.url.split('/public/event-media/');
      if (urlParts.length < 2) {
        throw new Error('Invalid media URL format.');
      }
      const filePathInBucket = urlParts[1];
      const fileExtension = filePathInBucket.split('.').pop()?.toLowerCase();

      const { data: blobData, error } = await supabase.storage
        .from('event-media')
        .download(filePathInBucket);

      if (error) {
        throw new Error(error.message);
      }

      if (!blobData) {
        throw new Error('No data received for download.');
      }

      const objectUrl = window.URL.createObjectURL(blobData);

      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = filePathInBucket.split('/').pop() || `event-media.${fileExtension}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      showSuccess('Media downloaded successfully!');
      
      window.URL.revokeObjectURL(objectUrl);
    } catch (error: any) {
      console.error(`[Media Download] Error:`, error);
      showError(`Failed to download media: ${error.message}`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {mediaItem?.type === 'image' ? <Image className="h-5 w-5 text-muted-foreground" /> :
           mediaItem?.type === 'video' ? <Video className="h-5 w-5 text-muted-foreground" /> :
           <Upload className="h-5 w-5 text-muted-foreground" />}
          {mediaItem ? `Media: ${mediaItem.type}` : 'Upload New Media'}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-between">
        {mediaItem ? (
          <div className="mb-4 flex-grow flex flex-col items-center justify-center">
            {mediaItem.type === 'image' && (
              <img src={mediaItem.url} alt="Event Media" className="max-w-full max-h-48 object-contain rounded-md mb-2" />
            )}
            {mediaItem.type === 'video' && (
              <video src={mediaItem.url} controls className="max-w-full max-h-48 object-contain rounded-md mb-2" />
            )}
            <p className="text-sm text-muted-foreground truncate w-full text-center">
              {mediaItem.url.split('/').pop()}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mb-4 text-center flex-grow flex items-center justify-center">
            No media selected.
          </p>
        )}
        <div className="flex flex-col gap-2 mt-auto">
          {!readOnly && !mediaItem && ( // Only show upload button if no media is present and not read-only
            <>
              <Label htmlFor={`media-upload-${mediaItem?.id || 'new'}`} className="w-full">
                <Button asChild className="w-full" disabled={uploading || downloading}>
                  <span>
                    <Upload className="mr-2 h-4 w-4" />
                    {uploading ? 'Uploading...' : 'Upload Media'}
                  </span>
                </Button>
              </Label>
              <Input
                id={`media-upload-${mediaItem?.id || 'new'}`}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading || downloading}
              />
            </>
          )}
          {mediaItem && (
            <Button
              variant="outline"
              onClick={handleDownload}
              disabled={uploading || downloading}
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" /> {downloading ? 'Processing...' : 'Download Media'}
            </Button>
          )}
          {mediaItem && !readOnly && (
            <Button
              variant="destructive"
              onClick={handleDeleteMedia}
              disabled={uploading || downloading}
              className="w-full"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {uploading ? 'Deleting...' : 'Delete Media'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MediaUploadCard;