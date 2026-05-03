import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import LiveMatchTracker from '../components/LiveMatchTracker';

interface Event {
  id: string;
  sport: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  status: string;
  markets?: any[];
}

const MatchDetails = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (eventId) {
      fetchEventDetails();
    }
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      const response = await axios.get(`/api/events/${eventId}`);
      setEvent(response.data);
    } catch (error) {
      console.error('Failed to fetch event details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white p-6 flex items-center justify-center">
        <p>Loading match details...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white p-6 flex items-center justify-center">
        <p className="text-gray-400">Match not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => window.history.back()}
          className="text-[#FFD700] hover:underline mb-6 flex items-center space-x-2"
        >
          ← Back to Events
        </button>

        {/* Match Header */}
        <div className="bg-[#1A1A1A] rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400">{event.league}</span>
            <span className={`px-3 py-1 rounded text-sm ${
              event.status === 'LIVE' ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-700 text-gray-300'
            }`}>
              {event.status}
            </span>
          </div>

          <div className="flex items-center justify-center space-x-8">
            <div className="text-center flex-1">
              <p className="text-2xl font-bold text-white">{event.homeTeam}</p>
            </div>
            <div className="text-center">
              {event.status === 'LIVE' && (
                <div className="text-sm text-gray-400 mb-2">LIVE</div>
              )}
            </div>
            <div className="text-center flex-1">
              <p className="text-2xl font-bold text-white">{event.awayTeam}</p>
            </div>
          </div>

          <div className="text-center mt-4 text-gray-400">
            {new Date(event.startTime).toLocaleString()}
          </div>
        </div>

        {/* Live Match Tracker (only for live events) */}
        {event.status === 'LIVE' && (
          <div className="mb-6">
            <LiveMatchTracker
              eventId={event.id}
              homeTeam={event.homeTeam}
              awayTeam={event.awayTeam}
            />
          </div>
        )}

        {/* Betting Markets */}
        {event.markets && event.markets.length > 0 && (
          <div className="bg-[#1A1A1A] rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Betting Markets</h2>
            <div className="space-y-4">
              {event.markets.map((market) => (
                <div key={market.id} className="border-b border-gray-800 pb-4 last:border-b-0">
                  <h3 className="text-lg text-gray-300 mb-2">{market.name}</h3>
                  <div className="flex space-x-2">
                    {market.odds
                      .filter((odd: any) => odd.current && odd.isActive)
                      .map((odd: any) => (
                        <button
                          key={odd.id}
                          className="bg-[#0A0A0A] border border-gray-700 px-6 py-3 rounded hover:border-[#FFD700] text-white hover:text-[#FFD700] transition"
                        >
                          {odd.value.toFixed(2)}
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchDetails;
