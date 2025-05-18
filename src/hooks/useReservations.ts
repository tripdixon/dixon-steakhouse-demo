import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';

export type Reservation = Database['public']['Tables']['reservations']['Row'];

export const useReservations = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newReservationIds, setNewReservationIds] = useState<Set<string>>(new Set());

  const deleteReservation = async (id: string) => {
    try {
      console.log("Deleting reservation:", id);

      // Delete the reservation directly - the ON DELETE CASCADE will handle the call
      const { error } = await supabase
        .from('reservations')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      // Remove from local state immediately for better UX
      setReservations(prev => prev.filter(r => r.id !== id));

      return true;
    } catch (err) {
      console.error("Error in deleteReservation:", err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
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
    setLoading(true);
    fetchReservations();
  };

  // Fetch initial reservations
  useEffect(() => {
    fetchReservations();
  }, []);

  // Set up real-time subscription with improved handling
  useEffect(() => {
    console.log("Setting up real-time subscription...");
    
    // Create a more specific channel name
    const channelName = `table-db-changes:public:reservations`;
    
    const channel = supabase
      .channel(channelName, {
        config: {
          broadcast: { ack: true }
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
            
            setReservations(prevReservations => {
              // Check if the reservation already exists to avoid duplicates
              const exists = prevReservations.some(r => r.id === newReservation.id);
              if (exists) {
                console.log("Reservation already exists, not adding duplicate");
                return prevReservations;
              }
              
              console.log("Adding new reservation to state");
              return [newReservation, ...prevReservations];
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
        // Attempt to reconnect
        setTimeout(() => {
          console.log('Attempting to reconnect...');
          channel.subscribe();
        }, 2000);
      })
      .subscribe((status) => {
        console.log(`Subscription status for ${channelName}:`, status);
        
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to real-time updates');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Error subscribing to real-time updates');
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
    deleteReservation
  };
};