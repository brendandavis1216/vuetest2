"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSupabase } from '@/integrations/supabase/SessionContextProvider';
import { showError, showSuccess } from '@/utils/toast';
import { Upload, FileText, Trash2 } from 'lucide-react';

interface DocumentUploadCardProps {
  eventId: string;
  documentType: 'renders' | 'contract' | 'invoice' | 'equipment_list' | 'other_documents' | 'signed_contract';
  currentUrl: string | null;
  onDocumentUpdated: () => void;
  readOnly?: boolean; // New prop to control editability
}

const DocumentUploadCard: React.FC<DocumentUploadCardProps> = ({
  eventId,
  documentType,
  currentUrl,
  onDocumentUpdated,
  readOnly = false, // Default to not read-only
}) => {
  const { supabase, session } = useSupabase();
  const [uploading, setUploading] = useState(false);

  const documentTitle = documentType.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly || !session?.user.id || !event.target.files || event.target.files.length === 0) {
      showError('No user session, file selected, or action is read-only.');
      return;
    }

    setUploading(true);
    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const filePath = `${eventId}/${documentType}-${Date.now()}.${fileExt}`; // Unique path per event/document type

    const { error: uploadError } = await supabase.storage
      .from('event-documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error(`Error uploading ${documentType}:`, uploadError.message);
      showError(`Failed to upload ${documentTitle}: ${uploadError.message}`);
      setUploading(false);
      return;
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('event-documents')
      .getPublicUrl(filePath);

    // Update the event record with the new URL
    const updateColumn = `${documentType}_url`;
    const { error: updateError } = await supabase
      .from('events')
      .update({ [updateColumn]: publicUrlData.publicUrl, updated_at: new Date().toISOString() })
      .eq('id', eventId);

    if (updateError) {
      console.error(`Error updating event with ${documentType} URL:`, updateError.message);
      showError(`Failed to update event with ${documentTitle} URL: ${updateError.message}`);
    } else {
      showSuccess(`${documentTitle} uploaded and linked successfully!`);
      onDocumentUpdated(); // Trigger a refresh of the parent component
    }
    setUploading(false);
  };

  const handleDeleteDocument = async () => {
    if (readOnly || !currentUrl) {
      showError(`No ${documentTitle} to delete or action is read-only.`);
      return;
    }

    setUploading(true); // Use uploading state for deletion too
    const urlParts = currentUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const filePath = `${eventId}/${fileName}`; // Reconstruct path for deletion

    const { error: deleteError } = await supabase.storage
      .from('event-documents')
      .remove([filePath]);

    if (deleteError) {
      console.error(`Error deleting ${documentType}:`, deleteError.message);
      showError(`Failed to delete ${documentTitle}: ${deleteError.message}`);
      setUploading(false);
      return;
    }

    // Clear the URL in the event record
    const updateColumn = `${documentType}_url`;
    const { error: updateError } = await supabase
      .from('events')
      .update({ [updateColumn]: null, updated_at: new Date().toISOString() })
      .eq('id', eventId);

    if (updateError) {
      console.error(`Error clearing ${documentType} URL in event:`, updateError.message);
      showError(`Failed to clear ${documentTitle} URL: ${updateError.message}`);
    } else {
      showSuccess(`${documentTitle} deleted successfully!`);
      onDocumentUpdated();
    }
    setUploading(false);
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
            <a href={currentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm truncate block">
              {currentUrl.split('/').pop()}
            </a>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mb-4">No {documentTitle.toLowerCase()} uploaded yet.</p>
        )}
        <div className="flex flex-col gap-2">
          {!readOnly && (
            <>
              <Label htmlFor={`${documentType}-upload`} className="w-full">
                <Button asChild className="w-full" disabled={uploading}>
                  <span>
                    <Upload className="mr-2 h-4 w-4" />
                    {uploading ? 'Uploading...' : `Upload ${documentTitle}`}
                  </span>
                </Button>
              </Label>
              <Input
                id={`${documentType}-upload`}
                type="file"
                accept="*/*" // Allow all file types for now
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
              />
            </>
          )}
          {currentUrl && (
            <>
              <Button
                variant="outline"
                onClick={() => window.open(currentUrl, '_blank')}
                disabled={uploading}
                className="w-full"
              >
                <FileText className="mr-2 h-4 w-4" /> View {documentTitle}
              </Button>

              {/* Show delete button only if not readOnly AND not a signed_contract */}
              {!readOnly && documentType !== 'signed_contract' && (
                <Button
                  variant="destructive"
                  onClick={handleDeleteDocument}
                  disabled={uploading}
                  className="w-full"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {uploading ? 'Deleting...' : `Delete ${documentTitle}`}
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentUploadCard;