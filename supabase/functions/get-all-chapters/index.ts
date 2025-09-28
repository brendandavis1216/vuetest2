import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

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
      return new Response(JSON.stringify({ error: 'Forbidden: Only administrators can access this resource.' }), {
        status: 403,
        headers: corsHeaders,
      });
    }

    // Use the service role key for fetching data to bypass RLS
    const supabaseServiceRoleClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: chapters, error } = await supabaseServiceRoleClient
      .from('chapters')
      .select('id, name')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching chapters:', error.message);
      return new Response(JSON.stringify({ error: `Failed to fetch chapters: ${error.message}` }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify(chapters), {
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