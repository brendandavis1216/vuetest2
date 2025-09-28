export interface Lead {
  id: string;
  created_at: string;
  school: string;
  fraternity: string;
  contact_phone: string;
  instagram_handle: string | null;
  contact_name: string | null;
  status: 'new' | 'contacted' | 'converted' | 'rejected';
  notes: string | null;
  created_by: string | null;
}