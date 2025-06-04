import { createClient } from 'npm:@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

interface BookingRequest {
  start_date_time: string;
  end_date_time: string;
  full_name: string;
  phone_number: string;
  guests: number;
  special_occasion?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse request body
    const request: BookingRequest = await req.json()
    
    // Insert the reservation
    const { data, error } = await supabaseClient
      .from('reservations')
      .insert([{
        start_date_time: request.start_date_time,
        end_date_time: request.end_date_time,
        full_name: request.full_name,
        phone_number: request.phone_number,
        guests: request.guests,
        special_occasion: request.special_occasion
      }])
      .select()
      .single()

    if (error) throw error

    return new Response(
      JSON.stringify({ message: 'Reservation booked successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ message: 'Failed to book reservation' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
});