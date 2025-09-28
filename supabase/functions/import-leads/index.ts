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

    // Get the user ID for created_by once before processing records
    const { data: userData, error: userAuthError } = await supabaseClient.auth.getUser();
    if (userAuthError || !userData.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Could not get user ID for lead creation.' }), {
        status: 401,
        headers: corsHeaders,
      });
    }
    const createdByUserId = userData.user.id;

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
      columns: ['school', 'fraternity', 'contact_phone', 'instagram_handle', 'contact_name', 'status', 'notes'], // Updated columns
    });

    const supabaseServiceRoleClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const leadsToInsert = [];
    const errors = [];

    for (const record of records) {
      const { school, fraternity, contact_phone, instagram_handle, contact_name, status, notes } = record as Record<string, string>;

      if (!school || !fraternity || !contact_phone) { // Validate required fields
        errors.push({ record, message: 'Missing required fields: school, fraternity, or contact_phone.' });
        continue;
      }

      // Basic phone number validation (simple regex for digits and optional plus sign)
      if (!/^\+?[0-9\s-()]{7,20}$/.test(contact_phone)) {
        errors.push({ record, message: 'Invalid contact_phone format.' });
        continue;
      }

      // Validate status if provided, otherwise default to 'new'
      const validStatuses = ['new', 'contacted', 'converted', 'rejected'];
      const finalStatus = status && validStatuses.includes(status.toLowerCase()) ? status.toLowerCase() : 'new';

      leadsToInsert.push({
        school,
        fraternity,
        contact_phone,
        instagram_handle: instagram_handle || null,
        contact_name: contact_name || null,
        status: finalStatus,
        notes: notes || null,
        created_by: createdByUserId, // Use the awaited user ID
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