import React, { useState } from 'react';
import { useReservations } from '../hooks/useReservations';
import { format } from 'date-fns';

const BUTTON_WIDTH = '180px';
const DEFAULT_DATE = new Date(2025, 5, 5, 13, 0); // June 5th, 2025 at 1:00 PM

const AvailabilityChecker: React.FC = () => {
  const [date, setDate] = useState(format(DEFAULT_DATE, 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState(format(DEFAULT_DATE, 'HH:mm'));
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ available: boolean; conflicting_reservations?: any[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bookingData, setBookingData] = useState({
    fullName: '',
    phoneNumber: '',
    guests: 2,
    specialOccasion: ''
  });
  
  const { checkAvailability, bookReservation, refreshReservations } = useReservations();
  
  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      // Convert local datetime to UTC
      const localStart = new Date(`${date}T${startTime}:00`);
      const startDateTime = localStart.toISOString();
      const endDateTime = new Date(localStart.getTime() + 2 * 60 * 60 * 1000).toISOString();
      
      const response = await checkAvailability(startDateTime, endDateTime);
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check availability');
    } finally {
      setLoading(false);
    }
  };
  
  const handleBook = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const localStart = new Date(`${date}T${startTime}:00`);
      const startDateTime = localStart.toISOString();
      const endDateTime = new Date(localStart.getTime() + 2 * 60 * 60 * 1000).toISOString();
      
      await bookReservation(
        startDateTime,
        endDateTime,
        bookingData.fullName,
        bookingData.phoneNumber,
        bookingData.guests,
        bookingData.specialOccasion || undefined
      );
      
      // Refresh the reservations table
      refreshReservations();
      
      setResult(null);
      setBookingData({
        fullName: '',
        phoneNumber: '',
        guests: 2,
        specialOccasion: ''
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to book reservation');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="w-full overflow-hidden border border-gray-200 rounded-lg bg-white">
      <form onSubmit={handleCheck} className="flex items-center gap-6 p-4">
        <div className="flex items-center gap-6 flex-grow">
          <div className="flex items-center gap-2">
            <label htmlFor="date" className="text-sm font-medium text-gray-700">Date:</label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={format(new Date(), 'yyyy-MM-dd')}
              className="flex-1 w-40 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-burgundy"
              required
            />
          </div>
          
          <div className="flex items-center gap-2">
            <label htmlFor="time" className="text-sm font-medium text-gray-700">Time:</label>
            <input
              type="time"
              id="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="flex-1 w-36 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-burgundy"
              required
            />
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          {error && (
            <div style={{ width: BUTTON_WIDTH }} className="whitespace-nowrap text-center py-1.5 bg-red-100 border border-red-200 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}
        
          {result && (
            <div 
              style={{ width: BUTTON_WIDTH }}
              className={`whitespace-nowrap text-center py-1.5 rounded-md ${
                result.available 
                  ? 'bg-green-100 border border-green-200 text-green-700'
                  : 'bg-red-100 border border-red-200 text-red-700'
              } text-sm`}
            >
              {result.available 
                ? '✓ Time slot is available!'
                : '✗ Not available'}
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            style={{ width: BUTTON_WIDTH }}
            className={`whitespace-nowrap px-4 py-1.5 text-sm rounded-md text-white transition-colors ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-burgundy hover:bg-burgundy/90'
            }`}
          >
            {loading ? 'Checking...' : 'Check Availability'}
          </button>
        </div>
      </form>
      
      {result?.available && (
        <div className="border-t border-gray-200 p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Book this time slot</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                type="text"
                id="fullName"
                value={bookingData.fullName}
                onChange={(e) => setBookingData(prev => ({ ...prev, fullName: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-burgundy focus:border-burgundy"
                required
              />
            </div>
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">Phone Number</label>
              <input
                type="tel"
                id="phoneNumber"
                value={bookingData.phoneNumber}
                onChange={(e) => setBookingData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-burgundy focus:border-burgundy"
                required
              />
            </div>
            <div>
              <label htmlFor="guests" className="block text-sm font-medium text-gray-700">Number of Guests</label>
              <input
                type="number"
                id="guests"
                min="1"
                max="20"
                value={bookingData.guests}
                onChange={(e) => setBookingData(prev => ({ ...prev, guests: parseInt(e.target.value) }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-burgundy focus:border-burgundy"
                required
              />
            </div>
            <div>
              <label htmlFor="specialOccasion" className="block text-sm font-medium text-gray-700">Special Occasion</label>
              <input
                type="text"
                id="specialOccasion"
                value={bookingData.specialOccasion}
                onChange={(e) => setBookingData(prev => ({ ...prev, specialOccasion: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-burgundy focus:border-burgundy"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={handleBook}
              disabled={loading}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${
                loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-burgundy hover:bg-burgundy/90'
              }`}
            >
              {loading ? 'Booking...' : 'Book Now'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvailabilityChecker;