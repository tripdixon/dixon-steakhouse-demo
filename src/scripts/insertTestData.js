import { supabase } from '../lib/supabase';

async function insertTestData() {
  console.log('Inserting test data...');
  
  try {
    // First create a call record
    const { data: callData, error: callError } = await supabase
      .from('calls')
      .insert([
        {
          phone_number: '555-123-4567',
          call_time: new Date().toISOString(),
          call_duration: 180, // 3 minutes
          call_cost: 0.50,
          call_end_reason: 'Completed',
          call_summary: 'Customer called to make a dinner reservation for 4 people.'
        }
      ])
      .select();
    
    if (callError) throw callError;
    console.log('Call inserted:', callData);
    
    if (!callData || callData.length === 0) {
      throw new Error('No call data returned after insert');
    }
    
    // Then create a reservation linked to the call
    const { data: resData, error: resError } = await supabase
      .from('reservations')
      .insert([
        {
          originating_call_id: callData[0].id,
          phone_number: '555-123-4567',
          full_name: 'John Smith',
          reservation_date: new Date().toISOString().split('T')[0], // Today
          reservation_time: '19:00:00', // 7 PM
          guests: 4,
          special_occasion: 'Birthday'
        }
      ])
      .select();
    
    if (resError) throw resError;
    console.log('Reservation inserted:', resData);
    
    console.log('Test data inserted successfully!');
    return { callData, resData };
  } catch (error) {
    console.error('Error inserting test data:', error);
    return { error };
  }
}

// Function to run the script from browser console
window.insertTestData = insertTestData;

export { insertTestData };