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
    log('info', 'Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders })
  }

  try {
    log('info', 'Starting reservation booking process');
    
    // Create Supabase client
    log('info', 'Initializing Supabase client');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse request body
    log('info', 'Parsing request body');
    const bodyText = await req.text();
    log('info', 'Raw request body', { body: bodyText });
    
    const request: BookingRequest = JSON.parse(bodyText);
    log('info', 'Parsed booking request', {
      start_date_time: request.start_date_time,
      end_date_time: request.end_date_time,
      full_name: request.full_name,
      guests: request.guests,
      special_occasion: request.special_occasion
    });
    
    // Insert the reservation
    log('info', 'Inserting reservation into database');
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

    if (error) {
      log('error', 'Database insertion error', { error });
      throw error;
    }

    log('info', 'Reservation booked successfully', { reservationId: data?.id });
    return new Response(
      JSON.stringify({ 
        message: 'Reservation booked successfully',
        reservation: data
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    log('error', 'Function execution error', { 
      message: error.message,
      stack: error.stack 
    });
    return new Response(
      JSON.stringify({ 
        message: 'Failed to book reservation',
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
});