import React, { useState } from 'react';
import { useReservations } from '../hooks/useReservations';
import { format } from 'date-fns';

const BUTTON_WIDTH = '180px';

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
        </div>
      </form>
    </div>
  );
};

export default AvailabilityChecker;