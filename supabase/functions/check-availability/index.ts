import { createClient } from 'npm:@supabase/supabase-js@2.39.3'

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
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse request body
    const { start_date_time, end_date_time }: AvailabilityRequest = await req.json()

    // Validate input
    if (!start_date_time || !end_date_time) {
      return new Response(
        JSON.stringify({ error: 'start_date_time and end_date_time are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check for overlapping reservations
    const { data: overlappingReservations, error } = await supabaseClient
      .from('reservations')
      .select('*')
      .lt('start_date_time', end_date_time)
      .gt('end_date_time', start_date_time)

    if (error) {
      throw error
    }

    const isAvailable = overlappingReservations.length === 0

    return new Response(
      JSON.stringify({
        available: isAvailable,
        conflicting_reservations: isAvailable ? [] : overlappingReservations
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
});