import { useEffect, useState } from 'react';

interface OddsCardProps {
  marketId: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  startTime: string;
  status: string;
  odds: Array<{
    id: string;
    value: number;
    isActive: boolean;
    flashing?: boolean;
  }>;
  onOddsClick: (marketId: string, odds: any) => void;
}

const ResponsiveOddsCard = ({ marketId, homeTeam, awayTeam, league, startTime, status, odds, onOddsClick }: Omit<OddsCardProps, 'eventId'>) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="bg-[#1A1A1A] rounded-lg border border-gray-800 hover:border-[#FFD700] transition">
      {/* Mobile Layout */}
      {isMobile ? (
        <div className="p-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-400 text-sm">{league}</span>
            <span className={`text-xs px-2 py-1 rounded ${
              status === 'LIVE' ? 'bg-red-600 animate-pulse' : 'bg-gray-700'
            }`}>
              {status}
            </span>
          </div>

          <div className="mb-3">
            <p className="font-semibold text-white text-sm">{homeTeam}</p>
            <p className="text-gray-400 text-xs">vs</p>
            <p className="font-semibold text-white text-sm">{awayTeam}</p>
          </div>

          <div className="text-gray-400 text-xs mb-3">
            {new Date(startTime).toLocaleString()}
          </div>

          <div className="flex space-x-2">
            {odds.filter(o => o.isActive).map((odd) => (
              <button
                key={odd.id}
                onClick={() => onOddsClick(marketId, odd)}
                className={`flex-1 py-3 rounded transition ${
                  odd.flashing 
                    ? 'bg-yellow-900 border border-yellow-500 text-yellow-300 animate-pulse' 
                    : 'bg-[#0A0A0A] border border-gray-700 text-white hover:border-[#FFD700]'
                }`}
              >
                <span className="font-bold">{odd.value.toFixed(2)}</span>
                {odd.flashing && <span className="ml-1 text-xs">⚡</span>}
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Desktop Layout */
        <div className="p-4">
          <div className="flex justify-between items-center mb-3">
            <div className="flex-1">
              <p className="font-semibold text-white">{homeTeam}</p>
              <p className="text-gray-400 text-sm">vs</p>
              <p className="font-semibold text-white">{awayTeam}</p>
            </div>

            <div className="text-right">
              <span className="text-gray-400 text-sm block mb-1">{league}</span>
              <span className={`text-xs px-2 py-1 rounded ${
                status === 'LIVE' ? 'bg-red-600 animate-pulse' : 'bg-gray-700'
              }`}>
                {status}
              </span>
              <p className="text-gray-400 text-xs mt-1">
                {new Date(startTime).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex space-x-2">
            {odds.filter(o => o.isActive).map((odd) => (
              <button
                key={odd.id}
                onClick={() => onOddsClick(marketId, odd)}
                className={`flex-1 px-6 py-3 rounded transition ${
                  odd.flashing 
                    ? 'bg-yellow-900 border border-yellow-500 text-yellow-300 animate-pulse' 
                    : 'bg-[#0A0A0A] border border-gray-700 text-white hover:border-[#FFD700]'
                }`}
              >
                <span className="font-bold">{odd.value.toFixed(2)}</span>
                {odd.flashing && <span className="ml-1 text-xs">⚡</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResponsiveOddsCard;
