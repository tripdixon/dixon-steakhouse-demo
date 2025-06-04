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

interface RetellRequest {
  name: string;
  call: Record<string, unknown>;
  args: {
    start_date_time: string;
    end_date_time: string;
    full_name: string;
    phone_number: string;
    guests: number;
    special_occasion?: string;
  };
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
    
    const parsedBody = JSON.parse(bodyText);
    
    // Extract booking parameters based on request structure
    let bookingParams: BookingRequest;
    
    if ('args' in parsedBody) {
      // Handle Retell request format
      const retellRequest = parsedBody as RetellRequest;
      bookingParams = retellRequest.args;
    } else {
      // Handle direct request format
      bookingParams = parsedBody as BookingRequest;
    }
    
    // Validate required fields
    const requiredFields = ['start_date_time', 'end_date_time', 'full_name', 'phone_number', 'guests'];
    const missingFields = requiredFields.filter(field => !bookingParams[field]);
    
    if (missingFields.length > 0) {
      log('error', 'Missing required fields', { missingFields });
      return new Response(
        JSON.stringify({
          message: 'Missing required fields',
          fields: missingFields
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    log('info', 'Parsed booking request', {
      start_date_time: bookingParams.start_date_time,
      end_date_time: bookingParams.end_date_time,
      full_name: bookingParams.full_name,
      guests: bookingParams.guests,
      special_occasion: bookingParams.special_occasion
    });
    
    // Insert the reservation
    log('info', 'Inserting reservation into database');
    const { data, error } = await supabaseClient
      .from('reservations')
      .insert([bookingParams])
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