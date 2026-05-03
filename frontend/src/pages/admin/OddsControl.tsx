import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

interface Event {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  status: string;
}

const fetchEvents = async (): Promise<Event[]> => {
  const response = await axios.get('/api/events', {
    headers: { Authorization: `Bearer ${localStorage.getItem('codebet_token')}` }
  });
  return [...response.data.live, ...response.data.preMatch];
};

const adjustOdds = async ({ eventId, marketId, oddsValue }: { eventId: string; marketId: string; oddsValue: number }) => {
  const response = await axios.put(`/api/admin/adjust-odds`, {
    eventId,
    marketId,
    oddsValue,
  }, {
    headers: { Authorization: `Bearer ${localStorage.getItem('codebet_token')}` }
  });
  return response.data;
};

const OddsControl = () => {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [oddsValue, setOddsValue] = useState('');
  const [selectedMarket, setSelectedMarket] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['adminEvents'],
    queryFn: fetchEvents,
  });

  const oddsMutation = useMutation({
    mutationFn: adjustOdds,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminEvents'] });
      alert('Odds updated successfully');
      setOddsValue('');
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || 'Failed to update odds');
    }
  });

  const handleUpdateOdds = () => {
    if (!selectedEvent || !selectedMarket || !oddsValue) return;
    oddsMutation.mutate({
      eventId: selectedEvent.id,
      marketId: selectedMarket,
      oddsValue: parseFloat(oddsValue),
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#1A1A1A] p-4 rounded-lg">
        <h3 className="text-white font-bold mb-4">Adjust Odds</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Select Event</label>
            <select
              value={selectedEvent?.id || ''}
              onChange={(e) => {
                const event = data?.find(ev => ev.id === e.target.value);
                setSelectedEvent(event || null);
                setSelectedMarket('');
              }}
              className="w-full bg-[#0A0A0A] border border-gray-700 rounded px-3 py-2 text-white focus:border-[#FFD700] focus:outline-none"
            >
              <option value="">Choose an event...</option>
              {data?.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.homeTeam} vs {event.awayTeam} ({event.league})
                </option>
              ))}
            </select>
          </div>

          {selectedEvent && (
            <div>
              <label className="block text-sm text-gray-300 mb-1">Market</label>
              <select
                value={selectedMarket}
                onChange={(e) => setSelectedMarket(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-gray-700 rounded px-3 py-2 text-white focus:border-[#FFD700] focus:outline-none"
              >
                <option value="">Select market...</option>
                <option value="1X2">1X2</option>
                <option value="OVER_UNDER">Over/Under</option>
                <option value="BOTH_TEAMS_SCORE">Both Teams Score</option>
              </select>
            </div>
          )}
        </div>

        {selectedMarket && (
          <div className="mb-4">
            <label className="block text-sm text-gray-300 mb-1">New Odds Value</label>
            <input
              type="number"
              value={oddsValue}
              onChange={(e) => setOddsValue(e.target.value)}
              placeholder="Enter new odds"
              className="w-full bg-[#0A0A0A] border border-gray-700 rounded px-4 py-2 text-white focus:border-[#FFD700] focus:outline-none"
            />
          </div>
        )}

        <button
          onClick={handleUpdateOdds}
          disabled={!selectedEvent || !selectedMarket || !oddsValue || oddsMutation.isPending}
          className="bg-[#FFD700] text-black px-6 py-2 rounded font-semibold hover:bg-[#FFD700]/90 disabled:opacity-50"
        >
          {oddsMutation.isPending ? 'Updating...' : 'Update Odds'}
        </button>
      </div>

      <div className="bg-[#1A1A1A] p-4 rounded-lg">
        <h3 className="text-white font-bold mb-4">All Events</h3>
        {isLoading ? (
          <p className="text-gray-400">Loading events...</p>
        ) : (
          <div className="space-y-2">
            {data?.map((event) => (
              <div key={event.id} className="bg-[#0A0A0A] p-3 rounded flex justify-between items-center">
                <div>
                  <p className="text-white font-semibold">{event.homeTeam} vs {event.awayTeam}</p>
                  <p className="text-gray-400 text-sm">{event.league}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${
                  event.status === 'LIVE' ? 'bg-red-600' : 'bg-gray-700'
                }`}>
                  {event.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OddsControl;
