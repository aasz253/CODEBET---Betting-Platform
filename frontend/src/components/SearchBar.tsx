import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

interface SearchResult {
  id: string;
  sport: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  status: string;
}

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const debouncedSearch = useCallback((searchQuery: string) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(async () => {
      if (searchQuery.trim().length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await axios.get(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        setResults(response.data.events || []);
        setShowResults(true);
      } catch (error) {
        console.error('Search failed:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  const handleResultClick = (eventId: string) => {
    window.location.href = `/betting?eventId=${eventId}`;
    setShowResults(false);
    setQuery('');
  };

  const handleClickOutside = (e: MouseEvent) => {
    if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
      setShowResults(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full max-w-2xl" ref={searchRef}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => query.length >= 2 && setShowResults(true)}
          placeholder="Search teams, leagues, or events..."
          className="w-full bg-[#1A1A1A] border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white focus:border-[#FFD700] focus:outline-none"
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          🔍
        </div>
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="animate-spin h-5 w-5 border-2 border-[#FFD700] border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#1A1A1A] border border-gray-700 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
          {results.map((event) => (
            <div
              key={event.id}
              onClick={() => handleResultClick(event.id)}
              className="p-4 hover:bg-gray-800 cursor-pointer border-b border-gray-700 last:border-b-0"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-white">
                    {event.homeTeam} vs {event.awayTeam}
                  </div>
                  <div className="text-sm text-gray-400">
                    {event.league} • {event.sport}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(event.startTime).toLocaleString()}
                  </div>
                </div>
                <div className={`text-sm px-2 py-1 rounded ${
                  event.status === 'LIVE' ? 'bg-green-900 text-green-500' : 'bg-gray-800 text-gray-400'
                }`}>
                  {event.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showResults && query.length >= 2 && results.length === 0 && !isLoading && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#1A1A1A] border border-gray-700 rounded-lg p-4 text-gray-400 z-50">
          No events found for "{query}"
        </div>
      )}
    </div>
  );
};

export default SearchBar;
