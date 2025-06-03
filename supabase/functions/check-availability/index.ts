import { createClient } from 'npm:@supabase/supabase-js@2.39.3'

// Helper function for structured logging
const log = (type: 'info' | 'error', message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(JSON.stringify({
    timestamp,
    type,
    message,
    ...data && { data }
  }));
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

interface AvailabilityRequest {
  start_date_time: string;
  end_date_time: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    log('info', 'Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders })
  }

  try {
    log('info', 'Starting availability check');
    
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    log('info', 'Parsing request body');
    // Parse request body
    const { start_date_time, end_date_time }: AvailabilityRequest = await req.json()
    log('info', 'Received request parameters', { start_date_time, end_date_time });

    // Validate input
    if (!start_date_time || !end_date_time) {
      log('error', 'Missing required parameters');
      return new Response(
        JSON.stringify({ error: 'start_date_time and end_date_time are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    log('info', 'Checking for overlapping reservations');
    // Check for overlapping reservations
    const { data: overlappingReservations, error } = await supabaseClient
      .from('reservations')
      .select('*')
      .lt('start_date_time', end_date_time)
      .gt('end_date_time', start_date_time)

    if (error) {
      log('error', 'Database query error', { error });
      throw error
    }

    const isAvailable = overlappingReservations.length === 0
    log('info', 'Availability check complete', { 
      isAvailable, 
      conflictCount: overlappingReservations.length 
    });

    return new Response(
      JSON.stringify({
        available: isAvailable,
        conflicting_reservations: isAvailable ? [] : overlappingReservations
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    log('error', 'Function execution error', { 
      message: error.message,
      stack: error.stack 
    });
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
});