"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSupabase } from '@/integrations/supabase/SessionContextProvider';
import { showError, showSuccess } from '@/utils/toast';
import { Upload, FileText, Trash2, Download } from 'lucide-react';

interface DocumentUploadCardProps {
  eventId: string;
  documentType: 'renders' | 'contract' | 'invoice' | 'equipment_list' | 'other_documents' | 'signed_contract';
  currentUrl: string | null;
  onDocumentUpdated: () => void;
  readOnly?: boolean;
}

const DocumentUploadCard: React.FC<DocumentUploadCardProps> = ({
  eventId,
  documentType,
  currentUrl,
  onDocumentUpdated,
  readOnly = false,
}) => {
  const { supabase, session } = useSupabase();
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false); // New state for download loading

  const documentTitle = documentType.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

  useEffect(() => {
    if (currentUrl) {
      console.log(`[${documentTitle}] Current document URL:`, currentUrl);
    } else {
      console.log(`[${documentTitle}] No document URL available.`);
    }
  }, [currentUrl, documentTitle]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly || !session?.user.id || !event.target.files || event.target.files.length === 0) {
      showError('No user session, file selected, or action is read-only.');
      return;
    }

    setUploading(true);
    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const filePath = `${eventId}/${documentType}-${Date.now()}.${fileExt}`;

    console.log(`[${documentTitle} Upload] Attempting to upload file: ${file.name}`);
    console.log(`[${documentTitle} Upload] Target filePath in storage: ${filePath}`);

    const { error: uploadError } = await supabase.storage
      .from('event-documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error(`[${documentTitle} Upload] Error uploading ${documentType}:`, uploadError.message);
      showError(`Failed to upload ${documentTitle}: ${uploadError.message}`);
      setUploading(false);
      return;
    }

    console.log(`[${documentTitle} Upload] File uploaded successfully. Getting public URL.`);
    const { data: publicUrlData } = supabase.storage
      .from('event-documents')
      .getPublicUrl(filePath);

    console.log(`[${documentTitle} Upload] Generated public URL: ${publicUrlData.publicUrl}`);

    const updateColumn = `${documentType}_url`;
    console.log(`[${documentTitle} Upload] Updating event ${eventId} with column ${updateColumn} to URL: ${publicUrlData.publicUrl}`);
    const { error: updateError } = await supabase
      .from('events')
      .update({ [updateColumn]: publicUrlData.publicUrl, updated_at: new Date().toISOString() })
      .eq('id', eventId);

    if (updateError) {
      console.error(`[${documentTitle} Upload] Error updating event with ${documentType} URL:`, updateError.message);
      showError(`Failed to update event with ${documentTitle} URL: ${updateError.message}`);
    } else {
      showSuccess(`${documentTitle} uploaded and linked successfully!`);
      onDocumentUpdated();
      console.log(`[${documentTitle} Upload] Event record updated successfully.`);
    }
    setUploading(false);
  };

  const handleDeleteDocument = async () => {
    if (readOnly || !currentUrl) {
      showError(`No ${documentTitle} to delete or action is read-only.`);
      return;
    }

    setUploading(true);
    const urlParts = currentUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const filePath = `${eventId}/${fileName}`;

    console.log(`[${documentTitle} Delete] Attempting to delete file from storage path: ${filePath}`);

    const { error: deleteError } = await supabase.storage
      .from('event-documents')
      .remove([filePath]);

    if (deleteError) {
      console.error(`[${documentTitle} Delete] Error deleting ${documentType}:`, deleteError.message);
      showError(`Failed to delete ${documentTitle}: ${deleteError.message}`);
      setUploading(false);
      return;
    }

    const updateColumn = `${documentType}_url`;
    console.log(`[${documentTitle} Delete] Clearing event ${eventId} column ${updateColumn}.`);
    const { error: updateError } = await supabase
      .from('events')
      .update({ [updateColumn]: null, updated_at: new Date().toISOString() })
      .eq('id', eventId);

    if (updateError) {
      console.error(`[${documentTitle} Delete] Error clearing ${documentType} URL in event:`, updateError.message);
      showError(`Failed to clear ${documentTitle} URL: ${updateError.message}`);
    } else {
      showSuccess(`${documentTitle} deleted successfully!`);
      onDocumentUpdated();
      console.log(`[${documentTitle} Delete] Document URL cleared successfully.`);
    }
    setUploading(false);
  };

  const handleDownload = async () => {
    if (!currentUrl) {
      showError(`No ${documentTitle} available to download.`);
      return;
    }

    setDownloading(true);
    try {
      const response = await fetch(currentUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = currentUrl.split('/').pop() || `${documentType}-document`; // Use original filename or a default
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showSuccess(`${documentTitle} downloaded successfully!`);
    } catch (error: any) {
      console.error(`[${documentTitle} Download] Error downloading document:`, error);
      showError(`Failed to download ${documentTitle}: ${error.message}`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          {documentTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-between">
        {currentUrl ? (
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">Document available.</p>
            {/* This link is just for displaying the filename, not for direct navigation/download */}
            <span className="text-blue-600 text-sm truncate block">
              {currentUrl.split('/').pop()}
            </span>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mb-4">No {documentTitle.toLowerCase()} uploaded yet.</p>
        )}
        <div className="flex flex-col gap-2">
          {!readOnly && (
            <>
              <Label htmlFor={`${documentType}-upload`} className="w-full">
                <Button asChild className="w-full" disabled={uploading || downloading}>
                  <span>
                    <Upload className="mr-2 h-4 w-4" />
                    {uploading ? 'Uploading...' : `Upload ${documentTitle}`}
                  </span>
                </Button>
              </Label>
              <Input
                id={`${documentType}-upload`}
                type="file"
                accept="*/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading || downloading}
              />
            </>
          )}
          {currentUrl && (
            <Button
              variant="outline"
              onClick={handleDownload} // Use the new handleDownload function
              disabled={uploading || downloading}
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" /> {downloading ? 'Downloading...' : `Download ${documentTitle}`}
            </Button>
          )}
          {currentUrl && !readOnly && documentType !== 'signed_contract' && (
            <Button
              variant="destructive"
              onClick={handleDeleteDocument}
              disabled={uploading || downloading}
              className="w-full"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {uploading ? 'Deleting...' : `Delete ${documentTitle}`}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentUploadCard;