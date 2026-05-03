import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';

const setBetLimits = async (data: { minStake: number; maxStake: number; userId?: string }) => {
  const response = await axios.post('/api/admin/bet-limits', data, {
    headers: { Authorization: `Bearer ${localStorage.getItem('codebet_token')}` }
  });
  return response.data;
};

const BetLimits = () => {
  const [minStake, setMinStake] = useState('');
  const [maxStake, setMaxStake] = useState('');
  const [userId, setUserId] = useState('');

  const limitsMutation = useMutation({
    mutationFn: setBetLimits,
    onSuccess: () => {
      alert('Bet limits set successfully');
      setMinStake('');
      setMaxStake('');
      setUserId('');
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || 'Failed to set bet limits');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!minStake || !maxStake) return;
    
    limitsMutation.mutate({
      minStake: parseFloat(minStake),
      maxStake: parseFloat(maxStake),
      userId: userId || undefined,
    });
  };

  return (
    <div className="max-w-2xl">
      <div className="bg-[#1A1A1A] p-6 rounded-lg">
        <h3 className="text-white font-bold mb-4">Set Bet Limits</h3>
        <p className="text-gray-400 text-sm mb-6">
          Leave user ID empty to set global limits. Specify user ID for individual limits.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">User ID (Optional)</label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Leave empty for global limits"
              className="w-full bg-[#0A0A0A] border border-gray-700 rounded px-4 py-2 text-white focus:border-[#FFD700] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Min Stake (KES)</label>
              <input
                type="number"
                value={minStake}
                onChange={(e) => setMinStake(e.target.value)}
                placeholder="e.g. 10"
                required
                className="w-full bg-[#0A0A0A] border border-gray-700 rounded px-4 py-2 text-white focus:border-[#FFD700] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">Max Stake (KES)</label>
              <input
                type="number"
                value={maxStake}
                onChange={(e) => setMaxStake(e.target.value)}
                placeholder="e.g. 10000"
                required
                className="w-full bg-[#0A0A0A] border border-gray-700 rounded px-4 py-2 text-white focus:border-[#FFD700] focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={limitsMutation.isPending}
            className="w-full bg-[#FFD700] text-black py-2 rounded font-semibold hover:bg-[#FFD700]/90 disabled:opacity-50"
          >
            {limitsMutation.isPending ? 'Setting...' : 'Set Bet Limits'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BetLimits;
