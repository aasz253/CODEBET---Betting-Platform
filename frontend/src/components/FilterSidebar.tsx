import { useState, useEffect } from 'react';
import { getSports, getLeagues } from '../services/eventService';

import { EventFilters } from '../services/eventService';

interface FilterSidebarProps {
  filters: EventFilters;
  onFilterChange: (filters: EventFilters) => void;
  onClearFilters: () => void;
}

const FilterSidebar = ({ filters, onFilterChange, onClearFilters }: FilterSidebarProps) => {
  const [sports, setSports] = useState<string[]>([]);
  const [leagues, setLeagues] = useState<string[]>([]);

  useEffect(() => {
    loadSports();
  }, []);

  useEffect(() => {
    if (filters.sport && filters.sport !== 'all') {
      loadLeagues(filters.sport);
    } else {
      loadLeagues();
    }
  }, [filters.sport]);

  const loadSports = async () => {
    try {
      const data = await getSports();
      setSports(data.sports || []);
    } catch (error) {
      console.error('Failed to load sports');
    }
  };

  const loadLeagues = async (sport?: string) => {
    try {
      const data = await getLeagues(sport);
      setLeagues(data.leagues || []);
    } catch (error) {
      console.error('Failed to load leagues');
    }
  };

  const handleChange = (key: string, value: string) => {
    const newFilters: EventFilters = { ...filters, [key]: value as any };
    onFilterChange(newFilters);
    saveFiltersToStorage(newFilters);
  };

  const saveFiltersToStorage = (filters: any) => {
    localStorage.setItem('codebet_filters', JSON.stringify(filters));
  };

  const handleClearFilters = () => {
    const defaultFilters: EventFilters = {
      sport: 'all',
      league: 'all',
      time: 'all',
      sortBy: 'startTime',
    };
    onFilterChange(defaultFilters);
    localStorage.removeItem('codebet_filters');
    onClearFilters();
  };

  return (
    <div className="bg-[#1A1A1A] rounded-lg p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-white">Filters</h3>
        <button
          onClick={handleClearFilters}
          className="text-sm text-[#FFD700] hover:text-[#FFD700]/80"
        >
          Clear All
        </button>
      </div>

      {/* Sport Filter */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">Sport</label>
        <select
          value={filters.sport}
          onChange={(e) => handleChange('sport', e.target.value)}
          className="w-full bg-[#0A0A0A] border border-gray-700 rounded px-3 py-2 text-white focus:border-[#FFD700] focus:outline-none"
        >
          <option value="all">All Sports</option>
          {sports.map((sport) => (
            <option key={sport} value={sport}>{sport}</option>
          ))}
        </select>
      </div>

      {/* League Filter */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">League</label>
        <select
          value={filters.league}
          onChange={(e) => handleChange('league', e.target.value)}
          className="w-full bg-[#0A0A0A] border border-gray-700 rounded px-3 py-2 text-white focus:border-[#FFD700] focus:outline-none"
        >
          <option value="all">All Leagues</option>
          {leagues.map((league) => (
            <option key={league} value={league}>{league}</option>
          ))}
        </select>
      </div>

      {/* Time Filter */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">Time</label>
        <div className="space-y-2">
          {[
            { value: 'all', label: 'All' },
            { value: 'live', label: 'Live Now' },
            { value: 'today', label: 'Today' },
            { value: 'tomorrow', label: 'Tomorrow' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => handleChange('time', option.value)}
              className={`w-full text-left px-3 py-2 rounded transition ${
                filters.time === option.value
                  ? 'bg-[#FFD700] text-black font-bold'
                  : 'bg-[#0A0A0A] text-gray-300 hover:bg-gray-800'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sort By */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">Sort By</label>
        <div className="space-y-2">
          {[
            { value: 'startTime', label: 'Start Time' },
            { value: 'popularity', label: 'Popularity' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => handleChange('sortBy', option.value)}
              className={`w-full text-left px-3 py-2 rounded transition ${
                filters.sortBy === option.value
                  ? 'bg-[#FFD700] text-black font-bold'
                  : 'bg-[#0A0A0A] text-gray-300 hover:bg-gray-800'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FilterSidebar;
