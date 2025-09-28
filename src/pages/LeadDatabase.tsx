"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSupabase } from '@/integrations/supabase/SessionContextProvider';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, PlusCircle, Search, UserPlus, UploadCloud } from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';
import { Skeleton } from '@/components/ui/skeleton';

interface Lead {
  id: string;
  created_at: string;
  school: string;
  fraternity: string;
  contact_phone: string; // Changed from contact_email
  instagram_handle: string | null; // New field
  contact_name: string | null;
  status: 'new' | 'contacted' | 'converted' | 'rejected';
  notes: string | null;
  created_by: string | null;
}

const formSchema = z.object({
  school: z.string().min(1, 'School is required.'),
  fraternity: z.string().min(1, 'Fraternity is required.'),
  contact_phone: z.string().regex(/^\+?[0-9\s-()]{7,20}$/, { // Updated validation for phone number
    message: 'Invalid phone number format.',
  }),
  instagram_handle: z.string().optional(), // New field
  contact_name: z.string().optional(),
  status: z.enum(['new', 'contacted', 'converted', 'rejected']).default('new'),
  notes: z.string().optional(),
});

const LeadDatabase = () => {
  const { supabase, session } = useSupabase();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingAdminStatus, setLoadingAdminStatus] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddLeadDialogOpen, setIsAddLeadDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importErrors, setImportErrors] = useState<any[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      school: '',
      fraternity: '',
      contact_phone: '', // Changed default
      instagram_handle: '', // New default
      contact_name: '',
      status: 'new',
      notes: '',
    },
  });

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

  const fetchLeads = useCallback(async () => {
    setLoadingLeads(true);
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching leads:', error.message);
      showError('Failed to load leads.');
      setLeads([]);
      setFilteredLeads([]);
    } else if (data) {
      setLeads(data as Lead[]);
      setFilteredLeads(data as Lead[]);
    }
    setLoadingLeads(false);
  }, [supabase]);

  useEffect(() => {
    checkAdminStatus();
  }, [checkAdminStatus]);

  useEffect(() => {
    if (!loadingAdminStatus) {
      if (!isAdmin) {
        showError('You do not have administrative access to view the lead database.');
        navigate('/dashboard', { replace: true });
      } else {
        fetchLeads();
      }
    }
  }, [isAdmin, loadingAdminStatus, navigate, fetchLeads]);

  useEffect(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    const results = leads.filter(lead =>
      lead.school.toLowerCase().includes(lowerCaseQuery) ||
      lead.fraternity.toLowerCase().includes(lowerCaseQuery) ||
      lead.contact_phone.toLowerCase().includes(lowerCaseQuery) || // Updated search field
      (lead.instagram_handle && lead.instagram_handle.toLowerCase().includes(lowerCaseQuery)) || // New search field
      (lead.contact_name && lead.contact_name.toLowerCase().includes(lowerCaseQuery)) ||
      lead.status.toLowerCase().includes(lowerCaseQuery)
    );
    setFilteredLeads(results);
  }, [searchQuery, leads]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!session?.user.id) {
      showError('You must be logged in to add a lead.');
      return;
    }

    const { error } = await supabase.from('leads').insert({
      ...values,
      created_by: session.user.id,
    });

    if (error) {
      console.error('Error adding lead:', error.message);
      showError(`Failed to add lead: ${error.message}`);
    } else {
      showSuccess('Lead added successfully!');
      form.reset();
      setIsAddLeadDialogOpen(false);
      fetchLeads(); // Refresh the list of leads
    }
  };

  const handleUpdateLeadStatus = async (leadId: string, newStatus: Lead['status']) => {
    const { error } = await supabase
      .from('leads')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', leadId);

    if (error) {
      console.error('Error updating lead status:', error.message);
      showError(`Failed to update lead status: ${error.message}`);
    } else {
      showSuccess('Lead status updated successfully!');
      fetchLeads(); // Refresh the list of leads
    }
  };

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
        headers: {
          'Content-Type': 'multipart/form-data', // Important for file uploads
        },
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
        setIsImportDialogOpen(false);
        setSelectedFile(null);
        fetchLeads(); // Refresh the list of leads
      }
    } catch (error: any) {
      console.error('Unexpected error during CSV import:', error.message);
      showError(`An unexpected error occurred: ${error.message}`);
    } finally {
      setImporting(false);
    }
  };

  if (loadingAdminStatus || loadingLeads) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Skeleton className="h-[300px] w-full max-w-4xl" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" onClick={() => navigate('/admin')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Admin Dashboard
        </Button>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <UserPlus className="h-7 w-7" /> Lead Database
        </h1>
        <div className="flex gap-2">
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <> {/* Explicitly wrap children in a fragment */}
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

          <Dialog open={isAddLeadDialogOpen} onOpenChange={setIsAddLeadDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <> {/* Explicitly wrap children in a fragment */}
                  <PlusCircle className="mr-2 h-4 w-4" /> Add New Lead
                </>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px)">
              <DialogHeader>
                <DialogTitle>Add New Lead</DialogTitle>
                <DialogDescription>
                  Enter the details for a potential client.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="school"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>School</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., University of XYZ" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="fraternity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fraternity/Sorority</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Alpha Beta Gamma" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contact_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Name (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contact_phone" // Changed field name
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Phone Number</FormLabel> {/* Changed label */}
                        <FormControl>
                          <Input type="tel" placeholder="e.g., +15551234567" {...field} /> {/* Changed type and placeholder */}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="instagram_handle" // New field
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instagram Handle (Optional)</FormLabel> {/* New label */}
                        <FormControl>
                          <Input placeholder="e.g., @johndoe" {...field} /> {/* New placeholder */}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <FormControl> {/* Corrected: FormControl wraps the entire Select */}
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="new">New</SelectItem>
                              <SelectItem value="contacted">Contacted</SelectItem>
                              <SelectItem value="converted">Converted</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Add any relevant notes here..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Adding Lead...' : 'Add Lead'}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Leads</CardTitle>
          <CardDescription>Manage potential clients and track their status.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search leads by school, fraternity, phone, Instagram, or status..." // Updated placeholder
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[150px]">School</TableHead>
                  <TableHead className="min-w-[150px]">Fraternity</TableHead>
                  <TableHead className="min-w-[200px]">Contact Phone</TableHead> {/* Changed header */}
                  <TableHead className="min-w-[150px]">Instagram Handle</TableHead> {/* New header */}
                  <TableHead className="min-w-[150px]">Contact Name</TableHead>
                  <TableHead className="min-w-[120px]">Status</TableHead>
                  <TableHead className="min-w-[180px]">Notes</TableHead>
                  <TableHead className="min-w-[120px]">Created At</TableHead>
                  <TableHead className="text-right min-w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.length === 0 && searchQuery !== '' ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-4"> {/* Updated colspan */}
                      No leads found matching your search.
                    </TableCell>
                  </TableRow>
                ) : filteredLeads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-4"> {/* Updated colspan */}
                      No leads available. Click "Add New Lead" or "Import CSV" to get started!
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.school}</TableCell>
                      <TableCell>{lead.fraternity}</TableCell>
                      <TableCell>{lead.contact_phone}</TableCell> {/* Changed cell content */}
                      <TableCell>{lead.instagram_handle || 'N/A'}</TableCell> {/* New cell content */}
                      <TableCell>{lead.contact_name || 'N/A'}</TableCell>
                      <TableCell>
                        <Select
                          value={lead.status}
                          onValueChange={(newStatus: Lead['status']) => handleUpdateLeadStatus(lead.id, newStatus)}
                          disabled={form.formState.isSubmitting}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="contacted">Contacted</SelectItem>
                            <SelectItem value="converted">Converted</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate">{lead.notes || 'N/A'}</TableCell>
                      <TableCell>{new Date(lead.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        {/* Future actions like "Edit Lead Details" or "Send Invite" */}
                        <Button variant="outline" size="sm" disabled>
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeadDatabase;