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

    const { chapterId } = await req.json();

    if (!chapterId) {
      return new Response(JSON.stringify({ error: 'Chapter ID is required.' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Use the service role key for fetching data to bypass RLS if necessary,
    // but only after the user's admin status has been verified.
    const supabaseServiceRoleClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch chapter name
    const { data: chapterData, error: chapterError } = await supabaseServiceRoleClient
      .from('chapters')
      .select('name')
      .eq('id', chapterId)
      .single();

    if (chapterError || !chapterData) {
      console.error('Error fetching chapter name:', chapterError?.message);
      return new Response(JSON.stringify({ error: `Chapter not found or failed to fetch: ${chapterError?.message}` }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    // Fetch total members for the chapter
    const { count: totalMembers, error: membersError } = await supabaseServiceRoleClient
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('chapter_id', chapterId);

    if (membersError) {
      console.error('Error fetching total members:', membersError.message);
      throw membersError;
    }

    // Fetch total events and sum of budgets for the chapter
    const { data: eventsData, error: eventsError } = await supabaseServiceRoleClient
      .from('events')
      .select('budget')
      .eq('chapter_id', chapterId);

    if (eventsError) {
      console.error('Error fetching events data:', eventsError.message);
      throw eventsError;
    }

    const totalEvents = eventsData.length;
    const totalBudget = eventsData.reduce((sum, event) => sum + (event.budget || 0), 0);
    const averageBudget = totalEvents > 0 ? totalBudget / totalEvents : 0;

    // Placeholder for LTV and Close Percentage - these would require more complex logic
    const ltv = 15000; // Mock value
    const close_percentage = 75; // Mock value

    const analytics = {
      chapter_name: chapterData.name,
      total_members: totalMembers || 0,
      total_events: totalEvents,
      average_budget: parseFloat(averageBudget.toFixed(2)),
      ltv,
      close_percentage,
    };

    return new Response(JSON.stringify(analytics), {
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