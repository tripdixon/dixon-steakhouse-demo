import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';
import { format, parseISO } from 'date-fns';

export type Reservation = Database['public']['Tables']['reservations']['Row'];

export const useReservations = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newReservationIds, setNewReservationIds] = useState<Set<string>>(new Set());

  const bookReservation = async (
    startDateTime: string,
    endDateTime: string,
    fullName: string,
    phoneNumber: string,
    guests: number,
    specialOccasion?: string
  ) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/book-reservation`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            start_date_time: startDateTime,
            end_date_time: endDateTime,
            full_name: fullName,
            phone_number: phoneNumber,
            guests: guests,
            special_occasion: specialOccasion
          })
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to book reservation');
      }
      
      // Fetch the latest reservations immediately after booking
      await fetchReservations();
      
      return await response.json();
    } catch (err) {
      console.error('Error booking reservation:', err);
      throw err;
    }
  };

  const checkAvailability = async (startDateTime: string, endDateTime: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-availability`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            start_date_time: startDateTime,
            end_date_time: endDateTime
          })
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to check availability');
      }
      
      return await response.json();
    } catch (err) {
      console.error('Error checking availability:', err);
      throw err;
    }
  };

  const deleteReservation = async (id: string) => {
    try {
      console.log("Deleting reservation:", id);
      const { error } = await supabase
        .from('reservations')
        .delete()
        .eq('id', id);

      if (error) {
        console.error("Delete error:", error);
        throw error;
      }

      // Remove from local state immediately for better UX
      setReservations(prev => prev.filter(r => r.id !== id));

      return true;
    } catch (err) {
      console.error("Error in deleteReservation:", err);
      setError(err instanceof Error ? err.message : 'Failed to delete reservation');
      return false;
    }
  };

  const fetchReservations = async () => {
    try {
      setLoading(true);
      console.log("Fetching reservations...");
      
      const { data, error, status } = await supabase
        .from('reservations')
        .select('*')
        .order('created_at', { ascending: false });

      console.log("Fetch response:", { data, error, status });

      if (error) throw error;
      if (data) {
        console.log(`Retrieved ${data.length} reservations`);
        setReservations(data);
      } else {
        console.log("No data returned");
        setReservations([]);
      }
    } catch (err) {
      console.error("Error fetching reservations:", err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Function to refresh reservations
  const refreshReservations = () => {
    fetchReservations();
  };

  // Fetch initial reservations
  useEffect(() => {
    fetchReservations();
  }, []);

  // Set up real-time subscription with improved handling
  useEffect(() => {
    console.log("Setting up real-time subscription...");
    const channelName = `reservations-${Math.random()}`;
    
    const channel = supabase
      .channel(channelName, {
        config: {
          broadcast: { ack: true, self: true }
        }
      })
      .on('postgres_changes', 
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reservations'
        },
        (payload) => {
          console.log("Received new reservation:", payload);
          
          try {
            const newReservation = payload.new as Reservation;
            console.log("Processing new reservation:", newReservation);

            setReservations(prev => {
              // Check if reservation already exists
              const exists = prev.some(r => r.id === newReservation.id);
              if (exists) return prev;
              
              // Add new reservation at the beginning of the list
              return [newReservation, ...prev];
            });
            
            // Mark as new for highlighting
            setNewReservationIds(prev => {
              const updated = new Set(prev);
              updated.add(newReservation.id);
              
              // Set timeout to remove highlight after 5 seconds
              setTimeout(() => {
                setNewReservationIds(current => {
                  const updated = new Set(current);
                  updated.delete(newReservation.id);
                  return updated;
                });
              }, 5000);
              
              return updated;
            });
          } catch (error) {
            console.error("Error processing real-time update:", error);
          }
        }
      )
      .on('postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'reservations'
        },
        (payload) => {
          console.log("Received deletion event:", payload);
          const deletedId = payload.old.id;
          
          setReservations(prevReservations => 
            prevReservations.filter(reservation => reservation.id !== deletedId)
          );
        }
      )
      .on('system', { event: 'connected' }, () => {
        console.log('Connected to Supabase real-time channel:', channelName);
      })
      .on('system', { event: 'disconnected' }, () => {
        console.log('Disconnected from Supabase real-time channel:', channelName);
      })

      .subscribe((status) => {
        console.log(`Subscription status for ${channelName}:`, status);
        
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to real-time updates');
          // Fetch initial data after subscription is established
          fetchReservations();
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Error subscribing to real-time updates');
          // Retry subscription after error
          setTimeout(() => {
            console.log('Retrying subscription...');
            channel.subscribe();
          }, 1000);
        }
      });

    // Cleanup function
    return () => {
      console.log("Unsubscribing from real-time updates");
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    reservations,
    loading,
    error,
    newReservationIds,
    refreshReservations,
    deleteReservation,
    checkAvailability,
    bookReservation
  };
};