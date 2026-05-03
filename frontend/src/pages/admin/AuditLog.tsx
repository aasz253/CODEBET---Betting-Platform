import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface Transaction {
  id: string;
  userId: string;
  type: string;
  amount: number;
  status: string;
  reference: string;
  createdAt: string;
  user?: {
    phoneNumber: string;
    fullName: string;
  };
}

interface AuditLogResponse {
  transactions: Transaction[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const fetchAuditLog = async (page: number, userId?: string, startDate?: string, endDate?: string, type?: string): Promise<AuditLogResponse> => {
  const params = new URLSearchParams({ page: page.toString(), limit: '50' });
  if (userId) params.append('userId', userId);
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  if (type) params.append('type', type);

  const response = await axios.get(`/api/admin/audit-log?${params}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('codebet_token')}` }
  });
  return response.data;
};

const AuditLog = () => {
  const [page, setPage] = useState(1);
  const [userId, setUserId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['auditLog', page, userId, startDate, endDate, typeFilter],
    queryFn: () => fetchAuditLog(
      page, 
      userId || undefined, 
      startDate || undefined, 
      endDate || undefined, 
      typeFilter || undefined
    ),
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'DEPOSIT': return 'text-[#00FF00]';
      case 'WITHDRAW': return 'text-red-500';
      case 'BET': return 'text-yellow-500';
      case 'WIN': return 'text-[#FFD700]';
      default: return 'text-gray-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-[#00FF00]';
      case 'FAILED': return 'text-red-500';
      case 'PENDING': return 'text-yellow-500';
      default: return 'text-gray-400';
    }
  };

  return (
    <div>
      <div className="bg-[#1A1A1A] p-4 rounded-lg mb-6">
        <h3 className="text-white font-bold mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">User ID</label>
            <input
              type="text"
              value={userId}
              onChange={(e) => { setUserId(e.target.value); setPage(1); }}
              placeholder="Filter by user"
              className="w-full bg-[#0A0A0A] border border-gray-700 rounded px-3 py-2 text-white text-sm focus:border-[#FFD700] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="w-full bg-[#0A0A0A] border border-gray-700 rounded px-3 py-2 text-white text-sm focus:border-[#FFD700] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="w-full bg-[#0A0A0A] border border-gray-700 rounded px-3 py-2 text-white text-sm focus:border-[#FFD700] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="w-full bg-[#0A0A0A] border border-gray-700 rounded px-3 py-2 text-white text-sm focus:border-[#FFD700] focus:outline-none"
            >
              <option value="">All</option>
              <option value="DEPOSIT">Deposit</option>
              <option value="WITHDRAW">Withdraw</option>
              <option value="BET">Bet</option>
              <option value="WIN">Win</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => { setUserId(''); setStartDate(''); setEndDate(''); setTypeFilter(''); setPage(1); }}
              className="w-full bg-gray-700 text-white py-2 rounded hover:bg-gray-600 text-sm"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-gray-400 text-center py-8">Loading...</div>
      ) : (
        <>
          <div className="bg-[#1A1A1A] rounded-lg overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-[#0A0A0A]">
                <tr>
                  <th className="p-4 text-gray-300">User</th>
                  <th className="p-4 text-gray-300">Type</th>
                  <th className="p-4 text-gray-300">Amount</th>
                  <th className="p-4 text-gray-300">Status</th>
                  <th className="p-4 text-gray-300">Reference</th>
                  <th className="p-4 text-gray-300">Date</th>
                </tr>
              </thead>
              <tbody>
                {data?.transactions.map((tx) => (
                  <tr key={tx.id} className="border-t border-gray-800 hover:bg-[#0A0A0A]">
                    <td className="p-4">
                      <p className="text-white text-sm">{tx.user?.fullName || 'N/A'}</p>
                      <p className="text-gray-400 text-xs">{tx.user?.phoneNumber || tx.userId}</p>
                    </td>
                    <td className={`p-4 font-semibold ${getTypeColor(tx.type)}`}>
                      {tx.type}
                    </td>
                    <td className="p-4 text-white">KES {tx.amount.toFixed(2)}</td>
                    <td className={`p-4 font-semibold ${getStatusColor(tx.status)}`}>
                      {tx.status}
                    </td>
                    <td className="p-4 text-gray-400 text-xs font-mono">{tx.reference}</td>
                    <td className="p-4 text-gray-400 text-sm">
                      {new Date(tx.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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

export default AuditLog;
