import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface Transaction {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAW' | 'BET' | 'WIN';
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  reference: string;
  createdAt: string;
}

interface TransactionResponse {
  transactions: Transaction[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const fetchTransactions = async (page: number) => {
  const params = new URLSearchParams({ page: page.toString(), limit: '20' });
  const response = await axios.get<TransactionResponse>(`/api/wallet/history?${params}`);
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

const Transactions = () => {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['transactions', page],
    queryFn: () => fetchTransactions(page),
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
    <div className="p-6">
      <h1 className="text-3xl font-bold text-[#FFD700] mb-6">Transactions</h1>

      {isLoading ? (
        <LoadingSkeleton />
      ) : isError ? (
        <div className="text-red-500 text-center py-8">Failed to load transactions</div>
      ) : (
        <>
          <div className="bg-[#1A1A1A] rounded-lg overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-[#0A0A0A]">
                <tr>
                  <th className="p-4 text-gray-300">Type</th>
                  <th className="p-4 text-gray-300">Amount</th>
                  <th className="p-4 text-gray-300">Status</th>
                  <th className="p-4 text-gray-300">Reference</th>
                  <th className="p-4 text-gray-300">Date</th>
                </tr>
              </thead>
              <tbody>
                {data?.transactions.map((tx) => (
                  <tr key={tx.id} className="border-t border-gray-800 hover:bg-[#0A0A0A] transition">
                    <td className={`p-4 font-semibold ${getTypeColor(tx.type)}`}>
                      {tx.type}
                    </td>
                    <td className="p-4 text-white">
                      KES {tx.amount.toFixed(2)}
                    </td>
                    <td className={`p-4 font-semibold ${getStatusColor(tx.status)}`}>
                      {tx.status}
                    </td>
                    <td className="p-4 text-gray-400 text-sm">{tx.reference}</td>
                    <td className="p-4 text-gray-400 text-sm">
                      {new Date(tx.createdAt).toLocaleString()}
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

export default Transactions;
