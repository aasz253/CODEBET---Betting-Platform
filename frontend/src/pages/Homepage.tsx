import { useState, useEffect } from 'react';
import { getEvents, EventFilters } from '../services/eventService';
import { listenToOddsChanges } from '../services/oddsService';
import { Event } from '../types/event';
import { useBetslipStore } from '../store/betslipStore';
import { useWebSocket } from '../hooks/useWebSocket';
import SearchBar from '../components/SearchBar';
import FilterSidebar from '../components/FilterSidebar';
import ResponsiveOddsCard from '../components/ResponsiveOddsCard';

const HomePage = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<EventFilters>(() => {
    const saved = localStorage.getItem('codebet_filters');
    return saved ? JSON.parse(saved) : {
      sport: 'all',
      league: 'all',
      time: 'all',
      sortBy: 'startTime',
    };
  });
  const addBet = useBetslipStore((state) => state.addBet);
  const updateOddsValue = useBetslipStore((state) => state.updateOddsValue);

  const { subscribeToEvent } = useWebSocket();

  useEffect(() => {
    const unsubscribe = listenToOddsChanges((update: any) => {
      setEvents((prev) => prev.map((event) => {
        if (event.id === update.eventId && event.markets) {
          return {
            ...event,
            markets: event.markets.map((market: any) => {
              if (market.id === update.marketId) {
                return {
                  ...market,
                  odds: market.odds.map((odd: any) => 
                    odd.current ? { ...odd, value: update.newValue, flashing: true } : odd
                  ),
                };
              }
              return market;
            }),
          };
        }
        return event;
      }));
      
      if (update.odds && update.odds.value) {
        updateOddsValue(update.marketId, update.newValue);
      }
    });

    return unsubscribe;
  }, [updateOddsValue]);

  useEffect(() => {
    fetchEvents();
  }, [filters]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const data = await getEvents(filters);
      setEvents(data.events || []);
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
    localStorage.setItem('codebet_filters', JSON.stringify(newFilters));
  };

  const handleClearFilters = () => {
    const defaultFilters: EventFilters = {
      sport: 'all',
      league: 'all',
      time: 'all',
      sortBy: 'startTime',
    };
    setFilters(defaultFilters);
    localStorage.removeItem('codebet_filters');
    fetchEvents();
  };

  useEffect(() => {
    events.forEach((event: Event) => {
      if (event.status === 'LIVE') {
        subscribeToEvent(event.id);
      }
    });
  }, [events, subscribeToEvent]);


  const clearFlashing = () => {
    setEvents((prev) => prev.map((event) => {
      if (event.markets) {
        return {
          ...event,
          markets: event.markets.map((market) => ({
            ...market,
            odds: market.odds.map((odd: any) => ({ ...odd, flashing: false })),
          })),
        };
      }
      return event;
    }));
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      clearFlashing();
    }, 3000);
    return () => clearTimeout(timer);
  }, [events]);

  const handleOddsClick = (event: Event, market: any, odds: any) => {
    addBet({
      eventId: event.id,
      marketId: market.id,
      oddsValue: odds.value,
      homeTeam: event.homeTeam,
      awayTeam: event.awayTeam,
      marketType: market.type,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-white">Loading events...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <SearchBar />
        </div>
      </div>

      <div className="flex gap-6">
        <div className="hidden md:block w-64 flex-shrink-0">
          <FilterSidebar 
            filters={filters} 
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />
        </div>

        <div className="flex-1">
          <h1 className="text-3xl font-bold text-[#FFD700] mb-6">Events</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map((event) => (
          <div key={event.id} className="bg-[#1A1A1A] rounded-lg p-4 border border-gray-800 hover:border-[#FFD700] transition">
            <div className="flex justify-between items-center mb-3">
              <span className="text-gray-400 text-sm">{event.league}</span>
              <span className={`text-xs px-2 py-1 rounded ${
                event.status === 'LIVE' ? 'bg-red-600 animate-pulse' : 'bg-gray-700'
              }`}>
                {event.status === 'LIVE' ? 'LIVE' : event.status}
              </span>
            </div>
            
            <div className="flex justify-between items-center mb-4">
              <div className="text-white">
                <p className="font-semibold">{event.homeTeam}</p>
                <p className="text-gray-400 text-sm">vs</p>
                <p className="font-semibold">{event.awayTeam}</p>
              </div>
              
              <div className="text-gray-400 text-sm">
                {new Date(event.startTime).toLocaleString()}
              </div>
            </div>

              {event.markets && event.markets.length > 0 && (
                <ResponsiveOddsCard
                  marketId={event.markets.find((m: any) => m.type === 'ONE_X_TWO')?.id || ''}
                  homeTeam={event.homeTeam}
                  awayTeam={event.awayTeam}
                  league={event.league}
                  startTime={event.startTime}
                  status={event.status}
                  odds={event.markets.find((m: any) => m.type === 'ONE_X_TWO')?.odds || []}
                  onOddsClick={(marketId, odds) => {
                    const market = event.markets?.find((m: any) => m.id === marketId);
                    if (market) handleOddsClick(event, market, odds);
                  }}
                />
              )}
          </div>
        ))}
      </div>

      {events.length === 0 && (
        <div className="text-center text-gray-400 mt-10">
          <p>No events available at the moment</p>
        </div>
      )}
      </div>
      </div>
    </div>
  );
};

export default HomePage;
