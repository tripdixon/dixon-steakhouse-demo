import React from 'react';
import { motion } from 'framer-motion';
import { format as dateFnsFormat } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';
import { RefreshCw, Trash2 } from 'lucide-react';
import { useReservations, Reservation } from '../hooks/useReservations';
import DeleteConfirmationModal from './DeleteConfirmationModal';

const ReservationTable: React.FC = () => {
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [selectedReservation, setSelectedReservation] = React.useState<Reservation | null>(null);
  const { 
    reservations, 
    loading, 
    error, 
    newReservationIds,
    refreshReservations,
    deleteReservation
  } = useReservations();

  if (loading) return <div className="flex justify-center p-8">Loading reservations...</div>;
  if (error) return <div className="text-red-600 p-4">Error: {error}</div>;

  const formatDate = (dateStr: string) => {
    try {
      // Create a UTC date by appending 'T00:00:00Z' to ensure UTC interpretation
      const utcDate = new Date(dateStr + 'T00:00:00Z');
      return dateFnsFormat(utcDate, 'MMM dd, yyyy');
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr: string) => {
    try {
      // Handle different time formats
      const [hours, minutes] = timeStr.split(':');
      return dateFnsFormat(new Date().setHours(Number(hours), Number(minutes)), 'h:mm a');
    } catch {
      return timeStr;
    }
  };

  const formatPhoneNumber = (phoneStr: string) => {
    try {
      // Remove any non-numeric characters
      const numbers = phoneStr.replace(/\D/g, '');
      
      // Check if country code is already included
      let formattedNumber;
      if (numbers.length === 10) {
        // Add +1 country code for US numbers if not present
        formattedNumber = `+1-${numbers.substring(0, 3)}-${numbers.substring(3, 6)}-${numbers.substring(6, 10)}`;
      } else if (numbers.length === 11 && numbers.startsWith('1')) {
        // If it's 11 digits and starts with 1, format with country code
        formattedNumber = `+${numbers.substring(0, 1)}-${numbers.substring(1, 4)}-${numbers.substring(4, 7)}-${numbers.substring(7, 11)}`;
      } else {
        // For other formats, try to normalize as best as possible
        formattedNumber = `+1-${phoneStr}`;
      }
      
      return formattedNumber;
    } catch {
      // If any error occurs, return the original string
      return phoneStr;
    }
  };

  return (
    <div className="w-full overflow-hidden border border-gray-200 rounded-lg">
      <div className="flex justify-between items-center p-4 bg-burgundy text-cream">
        <h2 className="text-xl font-serif">Booked Reservations</h2>
        <div className="flex space-x-2">
          <button 
            onClick={refreshReservations}
            className="flex items-center bg-charcoal text-cream px-3 py-1 rounded hover:bg-charcoal/80 transition"
          >
            <RefreshCw size={16} className="mr-1" />
            Refresh
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-charcoal text-cream">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Guest Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Guests
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reservations.map((reservation) => (
              <motion.tr
                key={reservation.id}
                initial={newReservationIds.has(reservation.id) ? { backgroundColor: 'rgba(212, 175, 55, 0.3)' } : {}}
                animate={{ backgroundColor: 'rgba(255, 255, 255, 0)' }}
                transition={{ duration: 5 }}
                className="hover:bg-gray-50"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {reservation.full_name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {formatDate(reservation.reservation_date)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {formatTime(reservation.reservation_time)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {reservation.guests}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {formatPhoneNumber(reservation.phone_number)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => {
                      setSelectedReservation(reservation);
                      setDeleteModalOpen(true);
                    }}
                    className="text-red-600 hover:text-red-800 transition-colors"
                    title="Delete reservation"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </motion.tr>
            ))}
            {reservations.length === 0 && (
              <tr className="hover:bg-gray-50">
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                  No reservations found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedReservation(null);
        }}
        onConfirm={async () => {
          if (selectedReservation) {
            const success = await deleteReservation(selectedReservation.id);
            if (!success) {
              // The real-time subscription will handle removing the item if deletion succeeds
              console.error('Failed to delete reservation');
            }
            setDeleteModalOpen(false);
            setSelectedReservation(null);
          }
        }}
        guestName={selectedReservation?.full_name || ''}
      />
    </div>
  );
};

export default ReservationTable;