import React, { useState } from 'react';
import { useReservations } from '../hooks/useReservations';
import { format } from 'date-fns';

const BUTTON_WIDTH = '140px';

const AvailabilityChecker: React.FC = () => {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState('18:00');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ available: boolean; conflicting_reservations?: any[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { checkAvailability } = useReservations();
  
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
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-md w-full">
      <form onSubmit={handleCheck} className="flex flex-wrap gap-4 items-end">
        <div className="flex gap-3">
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={format(new Date(), 'yyyy-MM-dd')}
              className="w-36 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-burgundy"
              required
            />
          </div>
          
          <div>
            <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
              Start Time
            </label>
            <input
              type="time"
              id="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-burgundy"
              required
            />
          </div>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          style={{ width: BUTTON_WIDTH }}
          className={`px-4 py-2 rounded-md text-white transition-colors ${
            loading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-burgundy hover:bg-burgundy/90'
          }`}
        >
          {loading ? 'Checking...' : 'Check Availability'}
        </button>
        
        {(error || result) && (
          <div className="flex-grow" />
        )}
        
        {error && (
          <div style={{ width: BUTTON_WIDTH }} className="text-center p-2 bg-red-100 border border-red-200 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
        
        {result && (
          <div 
            style={{ width: BUTTON_WIDTH }}
            className={`text-center p-2 rounded-md ${
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
      </form>
    </div>
  );
};

export default AvailabilityChecker;