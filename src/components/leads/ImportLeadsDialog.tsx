"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { UploadCloud } from 'lucide-react';
import { useSupabase } from '@/integrations/supabase/SessionContextProvider';
import { showError, showSuccess } from '@/utils/toast';

interface ImportLeadsDialogProps {
  onLeadsImported: () => void;
}

const ImportLeadsDialog: React.FC<ImportLeadsDialogProps> = ({ onLeadsImported }) => {
  const { supabase } = useSupabase();
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importErrors, setImportErrors] = useState<any[]>([]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleImportCsv = async () => {
    if (!selectedFile) {
      showError('Please select a CSV file to import.');
      return;
    }

    setImporting(true);
    setImportErrors([]);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const { data, error } = await supabase.functions.invoke('import-leads', {
        body: formData,
        // Removed 'Content-Type': 'multipart/form-data' header
        // The browser will automatically set the correct Content-Type header with the boundary.
      });

      if (error) {
        console.error('Error invoking import-leads function:', error.message);
        showError(`Import failed: ${error.message}`);
        if (error.context?.errors) {
          setImportErrors(error.context.errors);
        }
      } else if (data) {
        showSuccess(data.message);
        if (data.errors && data.errors.length > 0) {
          setImportErrors(data.errors);
          showError(`${data.errorCount} leads had errors during import.`);
        }
        setOpen(false);
        setSelectedFile(null);
        onLeadsImported();
      }
    } catch (error: any) {
      console.error('Unexpected error during CSV import:', error.message);
      showError(`An unexpected error occurred: ${error.message}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <>
            <UploadCloud className="mr-2 h-4 w-4" /> Import CSV
          </>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Import Leads from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file containing your leads. The file should have columns for 'school', 'fraternity', 'contact_phone', 'instagram_handle' (optional), 'contact_name' (optional), 'status' (optional), and 'notes' (optional).
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input
            id="csv-file"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            disabled={importing}
          />
          {selectedFile && <p className="text-sm text-muted-foreground">Selected: {selectedFile.name}</p>}
          {importErrors.length > 0 && (
            <div className="text-red-500 text-sm max-h-40 overflow-y-auto border border-red-300 p-2 rounded-md">
              <p className="font-semibold mb-1">Import Errors:</p>
              <ul className="list-disc pl-5">
                {importErrors.map((err, index) => (
                  <li key={index}>{err.message} (Record: {JSON.stringify(err.record)})</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <Button onClick={handleImportCsv} disabled={!selectedFile || importing}>
          {importing ? 'Importing...' : 'Start Import'}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default ImportLeadsDialog;