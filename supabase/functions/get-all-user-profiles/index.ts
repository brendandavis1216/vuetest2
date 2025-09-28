import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the user's JWT for RLS checks
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify if the calling user is an admin using the 'is_admin' RPC function
    const { data: isAdmin, error: adminCheckError } = await supabaseClient.rpc('is_admin');
    if (adminCheckError || !isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden: Only administrators can access this resource.' }), {
        status: 403,
        headers: corsHeaders,
      });
    }

    // Create a Supabase client with the service role key to bypass RLS for fetching all profiles and auth.users
    const supabaseServiceRoleClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch all profiles
    const { data: profiles, error: profilesError } = await supabaseServiceRoleClient
      .from('profiles')
      .select('id, school, fraternity, avatar_url, role');

    if (profilesError) {
      console.error('Error fetching profiles with service role:', profilesError.message);
      return new Response(JSON.stringify({ error: `Failed to fetch profiles: ${profilesError.message}` }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    // Fetch all auth.users to get emails
    const { data: authUsers, error: authUsersError } = await supabaseServiceRoleClient.auth.admin.listUsers();

    if (authUsersError) {
      console.error('Error fetching auth users with service role:', authUsersError.message);
      return new Response(JSON.stringify({ error: `Failed to fetch user emails: ${authUsersError.message}` }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    // Fetch all events to aggregate data
    const { data: events, error: eventsError } = await supabaseServiceRoleClient
      .from('events')
      .select('user_id, budget, event_date, signed_contract_url');

    if (eventsError) {
      console.error('Error fetching events with service role:', eventsError.message);
      return new Response(JSON.stringify({ error: `Failed to fetch events: ${eventsError.message}` }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    // Aggregate event data per user
    const userEventAnalytics = new Map<string, {
      totalEvents: number;
      totalBudget: number;
      signedContractsCount: number;
      lastEventDate: string | null;
    }>();

    events.forEach(event => {
      const userId = event.user_id;
      if (!userEventAnalytics.has(userId)) {
        userEventAnalytics.set(userId, {
          totalEvents: 0,
          totalBudget: 0,
          signedContractsCount: 0,
          lastEventDate: null,
        });
      }
      const analytics = userEventAnalytics.get(userId)!;
      analytics.totalEvents++;
      analytics.totalBudget += event.budget;
      if (event.signed_contract_url) {
        analytics.signedContractsCount++;
      }
      if (!analytics.lastEventDate || (event.event_date > analytics.lastEventDate)) {
        analytics.lastEventDate = event.event_date;
      }
    });

    // Map authUsers to a dictionary for efficient lookup
    const userEmailMap = new Map(authUsers.users.map(user => [user.id, user.email]));

    // Combine profiles with their emails and event analytics
    const profilesWithAnalytics = profiles.map(profile => {
      const analytics = userEventAnalytics.get(profile.id);
      return {
        ...profile,
        email: userEmailMap.get(profile.id) || 'N/A',
        totalEvents: analytics?.totalEvents || 0,
        averageBudget: analytics?.totalEvents ? (analytics.totalBudget / analytics.totalEvents) : 0,
        signedContractsCount: analytics?.signedContractsCount || 0,
        lastEventDate: analytics?.lastEventDate || null,
      };
    });

    return new Response(JSON.stringify(profilesWithAnalytics), {
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