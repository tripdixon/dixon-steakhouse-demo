import React from 'react';
import { motion } from 'framer-motion';
import { format as dateFnsFormat } from 'date-fns';
import { RefreshCw, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { useReservations, Reservation } from '../hooks/useReservations';
import DeleteConfirmationModal from './DeleteConfirmationModal';

const ReservationTable: React.FC = () => {
  const [sortField, setSortField] = React.useState<'full_name' | 'reservation_date' | 'guests' | null>(null);
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');
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

  const formatDate = React.useCallback((dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return dateFnsFormat(date, 'MMM dd, yyyy');
    } catch {
      return dateStr;
    }
  }, []);

  const formatTime = React.useCallback((timeStr: string) => {
    try {
      const [hours, minutes] = timeStr.split(':');
      return dateFnsFormat(new Date().setHours(Number(hours), Number(minutes)), 'h:mm a');
    } catch {
      return timeStr;
    }
  }, []);

  const formatPhoneNumber = React.useCallback((phoneStr: string) => {
    try {
      const numbers = phoneStr.replace(/\D/g, '');
      
      let formattedNumber;
      if (numbers.length === 10) {
        formattedNumber = `+1-${numbers.substring(0, 3)}-${numbers.substring(3, 6)}-${numbers.substring(6, 10)}`;
      } else if (numbers.length === 11 && numbers.startsWith('1')) {
        formattedNumber = `+${numbers.substring(0, 1)}-${numbers.substring(1, 4)}-${numbers.substring(4, 7)}-${numbers.substring(7, 11)}`;
      } else {
        formattedNumber = `+1-${phoneStr}`;
      }
      
      return formattedNumber;
    } catch {
      return phoneStr;
    }
  }, []);

  const handleSort = React.useCallback((field: 'full_name' | 'reservation_date' | 'guests') => {
    setSortField(prevField => {
      if (prevField === field) {
        setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        return field;
      }
      setSortDirection('asc');
      return field;
    });
  }, []);

  const sortedReservations = React.useMemo(() => {
    if (!sortField || !reservations) return reservations || [];
    
    return [...reservations].sort((a, b) => {
      if (sortField === 'reservation_date') {
        const dateA = new Date(a.reservation_date);
        const dateB = new Date(b.reservation_date);
        return sortDirection === 'asc' 
          ? dateA.getTime() - dateB.getTime()
          : dateB.getTime() - dateA.getTime();
      }
      
      if (sortField === 'guests') {
        return sortDirection === 'asc'
          ? (a.guests || 0) - (b.guests || 0)
          : (b.guests || 0) - (a.guests || 0);
      }
      
      const nameA = a.full_name?.toLowerCase() || '';
      const nameB = b.full_name?.toLowerCase() || '';
      return sortDirection === 'asc'
        ? nameA.localeCompare(nameB)
        : nameB.localeCompare(nameA);
    });
  }, [reservations, sortField, sortDirection]);

  if (loading) return <div className="flex justify-center p-8">Loading reservations...</div>;
  if (error) return <div className="text-red-600 p-4">Error: {error}</div>;

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
              <th 
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer group"
                onClick={() => handleSort('full_name')}
              >
                <div className="flex items-center space-x-1">
                  <span>Guest Name</span>
                  {sortField === 'full_name' ? (
                    sortDirection === 'asc' ? (
                      <ArrowUp size={14} className="inline" />
                    ) : (
                      <ArrowDown size={14} className="inline" />
                    )
                  ) : (
                    <ArrowUp size={14} className="inline opacity-0 group-hover:opacity-50" />
                  )}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer group"
                onClick={() => handleSort('reservation_date')}
              >
                <div className="flex items-center space-x-1">
                  <span>Date</span>
                  {sortField === 'reservation_date' ? (
                    sortDirection === 'asc' ? (
                      <ArrowUp size={14} className="inline" />
                    ) : (
                      <ArrowDown size={14} className="inline" />
                    )
                  ) : (
                    <ArrowUp size={14} className="inline opacity-0 group-hover:opacity-50" />
                  )}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Time
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer group"
                onClick={() => handleSort('guests')}
              >
                <div className="flex items-center space-x-1">
                  <span>Guests</span>
                  {sortField === 'guests' ? (
                    sortDirection === 'asc' ? (
                      <ArrowUp size={14} className="inline" />
                    ) : (
                      <ArrowDown size={14} className="inline" />
                    )
                  ) : (
                    <ArrowUp size={14} className="inline opacity-0 group-hover:opacity-50" />
                  )}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Special Occasion
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Chef's Table
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
            {sortedReservations.length > 0 ? (
              sortedReservations.map((reservation) => (
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
                    {reservation.special_occasion ? reservation.special_occasion.charAt(0).toUpperCase() + reservation.special_occasion.slice(1) : '---'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={reservation.chefs_table}
                      readOnly
                      className="h-4 w-4 text-burgundy border-gray-300 rounded focus:ring-burgundy"
                    />
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
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
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