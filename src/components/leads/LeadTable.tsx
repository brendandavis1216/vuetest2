"use client";

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { Lead } from '@/types/lead';

interface LeadTableProps {
  leads: Lead[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onUpdateLeadStatus: (id: string, status: Lead['status']) => void;
  loading: boolean;
}

const LeadTable: React.FC<LeadTableProps> = ({
  leads,
  searchQuery,
  setSearchQuery,
  onUpdateLeadStatus,
  loading,
}) => {
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search leads by school, fraternity, phone, Instagram, or status..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
          disabled={loading}
        />
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[150px]">School</TableHead>
              <TableHead className="min-w-[150px]">Fraternity</TableHead>
              <TableHead className="min-w-[200px]">Contact Phone</TableHead>
              <TableHead className="min-w-[150px]">Instagram Handle</TableHead>
              <TableHead className="min-w-[150px]">Contact Name</TableHead>
              <TableHead className="min-w-[120px]">Status</TableHead>
              <TableHead className="min-w-[180px]">Notes</TableHead>
              <TableHead className="min-w-[120px]">Created At</TableHead>
              <TableHead className="text-right min-w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.length === 0 && searchQuery !== '' ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-4">
                  No leads found matching your search.
                </TableCell>
              </TableRow>
            ) : leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-4">
                  No leads available. Click "Add New Lead" or "Import CSV" to get started!
                </TableCell>
              </TableRow>
            ) : (
              leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">{lead.school}</TableCell>
                  <TableCell>{lead.fraternity}</TableCell>
                  <TableCell>{lead.contact_phone}</TableCell>
                  <TableCell>
                    {lead.instagram_handle ? (
                      <a
                        href={`https://instagram.com/${lead.instagram_handle.replace(/^@/, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        {lead.instagram_handle}
                      </a>
                    ) : (
                      'N/A'
                    )}
                  </TableCell>
                  <TableCell>{lead.contact_name || 'N/A'}</TableCell>
                  <TableCell>
                    <Select
                      value={lead.status}
                      onValueChange={(newStatus: Lead['status']) => onUpdateLeadStatus(lead.id, newStatus)}
                      disabled={loading}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="contacted">Contacted</SelectItem>
                        <SelectItem value="no_answer">No Answer</SelectItem>
                        <SelectItem value="declined">Declined</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="max-w-[180px] truncate">{lead.notes || 'N/A'}</TableCell>
                  <TableCell>{new Date(lead.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
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
    </div>
  );
};

export default LeadTable;