import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface Bet {
  id: string;
  stake: number;
  oddsValue: number;
  potentialWin: number;
  status: 'PENDING' | 'WON' | 'LOST' | 'CANCELLED' | 'CASHED_OUT';
  createdAt: string;
  event: {
    homeTeam: string;
    awayTeam: string;
  };
  market: {
    type: string;
  };
}

interface BetHistoryResponse {
  bets: Bet[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const fetchBetHistory = async (page: number, startDate?: string, endDate?: string, status?: string) => {
  const params = new URLSearchParams({ page: page.toString(), limit: '20' });
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  if (status) params.append('status', status);
  
  const response = await axios.get<BetHistoryResponse>(`/api/bets/history?${params}`);
  return response.data;
};

const LoadingSkeleton = () => (
  <div className="space-y-2">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="bg-[#1A1A1A] p-4 rounded animate-pulse">
        <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-700 rounded w-1/2"></div>
      </div>
    ))}
  </div>
);

const BetHistory = () => {
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['betHistory', page, startDate, endDate, statusFilter],
    queryFn: () => fetchBetHistory(page, startDate || undefined, endDate || undefined, statusFilter || undefined),
  });

  const getStatusColor = (status: Bet['status']) => {
    switch (status) {
      case 'WON': return 'text-[#00FF00]';
      case 'LOST': return 'text-red-500';
      case 'PENDING': return 'text-yellow-500';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-[#FFD700] mb-6">Bet History</h1>

      {/* Filters */}
      <div className="bg-[#1A1A1A] p-4 rounded-lg mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="w-full bg-[#0A0A0A] border border-gray-700 rounded px-3 py-2 text-white focus:border-[#FFD700] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="w-full bg-[#0A0A0A] border border-gray-700 rounded px-3 py-2 text-white focus:border-[#FFD700] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="w-full bg-[#0A0A0A] border border-gray-700 rounded px-3 py-2 text-white focus:border-[#FFD700] focus:outline-none"
            >
              <option value="">All</option>
              <option value="WON">Won</option>
              <option value="LOST">Lost</option>
              <option value="PENDING">Pending</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => { setStartDate(''); setEndDate(''); setStatusFilter(''); setPage(1); }}
              className="w-full bg-gray-700 text-white py-2 rounded hover:bg-gray-600 transition"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton />
      ) : isError ? (
        <div className="text-red-500 text-center py-8">Failed to load bet history</div>
      ) : (
        <>
          <div className="bg-[#1A1A1A] rounded-lg overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-[#0A0A0A]">
                <tr>
                  <th className="p-4 text-gray-300">Event</th>
                  <th className="p-4 text-gray-300">Market</th>
                  <th className="p-4 text-gray-300">Stake</th>
                  <th className="p-4 text-gray-300">Odds</th>
                  <th className="p-4 text-gray-300">Potential Win</th>
                  <th className="p-4 text-gray-300">Status</th>
                  <th className="p-4 text-gray-300">Date</th>
                </tr>
              </thead>
              <tbody>
                {data?.bets.map((bet) => (
                  <tr key={bet.id} className="border-t border-gray-800 hover:bg-[#0A0A0A] transition">
                    <td className="p-4 text-white">
                      {bet.event.homeTeam} vs {bet.event.awayTeam}
                    </td>
                    <td className="p-4 text-gray-300">{bet.market.type}</td>
                    <td className="p-4 text-white">KES {bet.stake.toFixed(2)}</td>
                    <td className="p-4 text-[#FFD700]">{bet.oddsValue.toFixed(2)}</td>
                    <td className="p-4 text-[#00FF00]">KES {bet.potentialWin.toFixed(2)}</td>
                    <td className={`p-4 font-semibold ${getStatusColor(bet.status)}`}>
                      {bet.status}
                    </td>
                    <td className="p-4 text-gray-400 text-sm">
                      {new Date(bet.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && data.pagination.totalPages > 1 && (
            <div className="flex justify-center space-x-2 mt-6">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-[#1A1A1A] text-white rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-white">
                Page {page} of {data.pagination.totalPages}
              </span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page === data.pagination.totalPages}
                className="px-4 py-2 bg-[#1A1A1A] text-white rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BetHistory;
