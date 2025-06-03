import { createClient } from 'npm:@supabase/supabase-js@2.39.3'
import { addDays, addMinutes, parseISO, isEqual, isBefore, isAfter } from 'npm:date-fns@2.30.0'
import { zonedTimeToUtc, utcToZonedTime } from 'npm:date-fns-tz@2.0.0'

// Constants
const TIMEZONE = 'America/New_York';
const RESTAURANT_OPEN_HOUR = 11; // 11:00 AM EDT
const RESTAURANT_CLOSE_HOUR = 23; // 11:00 PM EDT
const TIME_SLOT_INCREMENT = 30; // minutes
const RESERVATION_DURATION = 120; // minutes (2 hours)

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
  };
}

interface AvailabilityRequest {
  start_date_time: string;
  end_date_time: string;
}

// Helper function to check if a time slot is within restaurant hours
const isWithinRestaurantHours = (date: Date): boolean => {
  const localTime = utcToZonedTime(date, TIMEZONE);
  const hour = localTime.getHours();
  return hour >= RESTAURANT_OPEN_HOUR && hour < RESTAURANT_CLOSE_HOUR;
};

// Helper function to check if a time slot is available
const isTimeSlotAvailable = async (
  supabaseClient: ReturnType<typeof createClient>,
  startTime: Date,
  endTime: Date
): Promise<boolean> => {
  const { data: overlappingReservations, error } = await supabaseClient
    .from('reservations')
    .select('*')
    .lt('start_date_time', endTime.toISOString())
    .gt('end_date_time', startTime.toISOString());

  if (error) throw error;
  return overlappingReservations.length === 0;
};

// Helper function to get all possible time slots for a day
const getPossibleTimeSlotsForDay = (date: Date): Date[] => {
  const slots: Date[] = [];
  let currentTime = zonedTimeToUtc(
    new Date(date.setHours(RESTAURANT_OPEN_HOUR, 0, 0, 0)),
    TIMEZONE
  );
  
  const closeTime = zonedTimeToUtc(
    new Date(date.setHours(RESTAURANT_CLOSE_HOUR, 0, 0, 0)),
    TIMEZONE
  );

  while (isBefore(currentTime, closeTime)) {
    if (isWithinRestaurantHours(currentTime)) {
      const endTime = addMinutes(currentTime, RESERVATION_DURATION);
      if (!isAfter(endTime, closeTime)) {
        slots.push(currentTime);
      }
    }
    currentTime = addMinutes(currentTime, TIME_SLOT_INCREMENT);
  }

  return slots;
};

// Find the nearest available time on the same day or subsequent days
const findAlternative1 = async (
  supabaseClient: ReturnType<typeof createClient>,
  requestedDateTime: Date
): Promise<Date | null> => {
  let currentDate = new Date(requestedDateTime);
  
  for (let day = 0; day < 14; day++) { // Look up to 14 days ahead
    const slots = getPossibleTimeSlotsForDay(currentDate);
    
    // Sort slots by their distance from the requested time
    const sortedSlots = slots.sort((a, b) => {
      const distanceA = Math.abs(a.getTime() - requestedDateTime.getTime());
      const distanceB = Math.abs(b.getTime() - requestedDateTime.getTime());
      if (distanceA === distanceB) {
        return b.getTime() - a.getTime(); // Prefer later time if distances are equal
      }
      return distanceA - distanceB;
    });

    // Check each slot for availability
    for (const slot of sortedSlots) {
      const endTime = addMinutes(slot, RESERVATION_DURATION);
      if (await isTimeSlotAvailable(supabaseClient, slot, endTime)) {
        return slot;
      }
    }

    currentDate = addDays(currentDate, 1);
  }

  return null;
};

// Find the same time on subsequent days
const findAlternative2 = async (
  supabaseClient: ReturnType<typeof createClient>,
  requestedDateTime: Date
): Promise<Date | null> => {
  let currentDate = addDays(requestedDateTime, 1); // Start with next day
  
  for (let day = 0; day < 14; day++) { // Look up to 14 days ahead
    const targetTime = new Date(currentDate);
    targetTime.setHours(
      requestedDateTime.getHours(),
      requestedDateTime.getMinutes(),
      0,
      0
    );

    if (isWithinRestaurantHours(targetTime)) {
      const endTime = addMinutes(targetTime, RESERVATION_DURATION);
      if (await isTimeSlotAvailable(supabaseClient, targetTime, endTime)) {
        return targetTime;
      }
    }

    currentDate = addDays(currentDate, 1);
  }

  return null;
};

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
    const bodyText = await req.text();
    log('info', 'Raw request body', { body: bodyText });
    
    const request: RetellRequest | AvailabilityRequest = JSON.parse(bodyText);
    
    // Extract parameters based on request structure
    let start_date_time: string;
    let end_date_time: string;
    
    if ('args' in request) {
      ({ start_date_time, end_date_time } = request.args);
    } else {
      ({ start_date_time, end_date_time } = request);
    }
    
    log('info', 'Received request parameters', { start_date_time, end_date_time });

    // Validate input
    if (!start_date_time || !end_date_time) {
      log('error', 'Missing required parameters');
      return new Response(
        JSON.stringify({ error: 'start_date_time and end_date_time are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const requestedStartTime = parseISO(start_date_time);
    const requestedEndTime = parseISO(end_date_time);

    // Check if requested time is within restaurant hours
    if (!isWithinRestaurantHours(requestedStartTime)) {
      return new Response(
        JSON.stringify({ 
          error: 'Requested time is outside restaurant hours (11:00 AM - 11:00 PM EDT)',
          available: false 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    log('info', 'Checking for overlapping reservations');
    const isAvailable = await isTimeSlotAvailable(supabaseClient, requestedStartTime, requestedEndTime);

    let response: any = { available: isAvailable };

    // If the requested time is not available, find alternatives
    if (!isAvailable) {
      log('info', 'Finding alternative times');
      const [alt1, alt2] = await Promise.all([
        findAlternative1(supabaseClient, requestedStartTime),
        findAlternative2(supabaseClient, requestedStartTime)
      ]);

      if (alt1) response.alternative_datetime_1 = alt1.toISOString();
      if (alt2) response.alternative_datetime_2 = alt2.toISOString();
    }

    log('info', 'Availability check complete', { response });
    return new Response(
      JSON.stringify(response),
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