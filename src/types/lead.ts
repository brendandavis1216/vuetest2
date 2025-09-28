export interface Lead {
  id: string;
  created_at: string;
  school: string;
  fraternity: string;
  contact_phone: string;
  instagram_handle: string | null;
  contact_name: string | null;
  status: 'contacted' | 'no_answer' | 'declined'; // Updated status types
  notes: string | null;
  created_by: string | null;
}