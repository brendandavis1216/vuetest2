import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { parse } from "https://deno.land/std@0.190.0/csv/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify if the calling user is an admin
    const { data: isAdmin, error: adminCheckError } = await supabaseClient.rpc('is_admin');
    if (adminCheckError || !isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden: Only administrators can import leads.' }), {
        status: 403,
        headers: corsHeaders,
      });
    }

    const formData = await req.formData();
    const csvFile = formData.get('file') as File;

    if (!csvFile) {
      return new Response(JSON.stringify({ error: 'No CSV file provided.' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const csvText = await csvFile.text();
    const records = await parse(csvText, {
      skipFirstRow: true, // Assuming the first row is headers
      columns: ['school', 'fraternity', 'contact_email', 'contact_name', 'status', 'notes'],
    });

    const supabaseServiceRoleClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const leadsToInsert = [];
    const errors = [];
    const createdBy = supabaseClient.auth.getUser().then(res => res.data.user?.id); // Get user ID for created_by

    for (const record of records) {
      const { school, fraternity, contact_email, contact_name, status, notes } = record as Record<string, string>;

      if (!school || !fraternity || !contact_email) {
        errors.push({ record, message: 'Missing required fields: school, fraternity, or contact_email.' });
        continue;
      }

      // Basic email validation
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact_email)) {
        errors.push({ record, message: 'Invalid contact_email format.' });
        continue;
      }

      // Validate status if provided, otherwise default to 'new'
      const validStatuses = ['new', 'contacted', 'converted', 'rejected'];
      const finalStatus = status && validStatuses.includes(status.toLowerCase()) ? status.toLowerCase() : 'new';

      leadsToInsert.push({
        school,
        fraternity,
        contact_email,
        contact_name: contact_name || null,
        status: finalStatus,
        notes: notes || null,
        created_by: await createdBy,
      });
    }

    if (leadsToInsert.length === 0 && errors.length > 0) {
      return new Response(JSON.stringify({ message: 'No valid leads to insert.', errors }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const { error: insertError } = await supabaseServiceRoleClient
      .from('leads')
      .insert(leadsToInsert);

    if (insertError) {
      console.error('Error inserting leads:', insertError.message);
      return new Response(JSON.stringify({ error: `Failed to insert leads: ${insertError.message}`, errors }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({
      message: `${leadsToInsert.length} leads imported successfully.`,
      insertedCount: leadsToInsert.length,
      errorCount: errors.length,
      errors,
    }), {
      status: 200,
      headers: corsHeaders,
    });

  } catch (error) {
    console.error('Edge function error:', error.message);
    return new Response(JSON.stringify({ error: 'Internal server error.' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});