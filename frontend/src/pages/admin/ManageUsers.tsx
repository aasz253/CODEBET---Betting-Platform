import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

interface User {
  id: string;
  phoneNumber: string;
  fullName: string;
  isVerified: boolean;
  isAgeVerified: boolean;
  role: string;
  createdAt: string;
  suspended?: boolean;
}

const fetchUsers = async (phoneNumber?: string): Promise<User[]> => {
  const params = phoneNumber ? `?phoneNumber=${phoneNumber}` : '';
  const response = await axios.get(`/api/admin/users${params}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('codebet_token')}` }
  });
  return response.data;
};

const suspendUser = async ({ userId, reason }: { userId: string; reason: string }) => {
  const response = await axios.post('/api/admin/suspend-user', { userId, reason }, {
    headers: { Authorization: `Bearer ${localStorage.getItem('codebet_token')}` }
  });
  return response.data;
};

const ManageUsers = () => {
  const [searchPhone, setSearchPhone] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['adminUsers', searchPhone],
    queryFn: () => fetchUsers(searchPhone || undefined),
  });

  const suspendMutation = useMutation({
    mutationFn: suspendUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      setShowSuspendModal(false);
      setSuspendReason('');
      alert('User suspended successfully');
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || 'Failed to suspend user');
    }
  });

  const handleSearch = () => {
    refetch();
  };

  const handleSuspend = (user: User) => {
    setSelectedUser(user);
    setShowSuspendModal(true);
  };

  const confirmSuspend = () => {
    if (!selectedUser || !suspendReason) return;
    suspendMutation.mutate({ userId: selectedUser.id, reason: suspendReason });
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#1A1A1A] p-4 rounded-lg">
        <div className="flex gap-2">
          <input
            type="tel"
            value={searchPhone}
            onChange={(e) => setSearchPhone(e.target.value)}
            placeholder="Search by phone number"
            className="flex-1 bg-[#0A0A0A] border border-gray-700 rounded px-4 py-2 text-white focus:border-[#FFD700] focus:outline-none"
          />
          <button
            onClick={handleSearch}
            className="bg-[#FFD700] text-black px-6 py-2 rounded font-semibold hover:bg-[#FFD700]/90"
          >
            Search
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-white">Loading...</div>
      ) : (
        <div className="bg-[#1A1A1A] rounded-lg overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-[#0A0A0A]">
              <tr>
                <th className="p-4 text-gray-300">Name</th>
                <th className="p-4 text-gray-300">Phone</th>
                <th className="p-4 text-gray-300">Age Verified</th>
                <th className="p-4 text-gray-300">Role</th>
                <th className="p-4 text-gray-300">Status</th>
                <th className="p-4 text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((user) => (
                <tr key={user.id} className="border-t border-gray-800 hover:bg-[#0A0A0A]">
                  <td className="p-4 text-white">{user.fullName}</td>
                  <td className="p-4 text-gray-300">{user.phoneNumber}</td>
                  <td className="p-4">
                    <span className={user.isAgeVerified ? 'text-[#00FF00]' : 'text-red-500'}>
                      {user.isAgeVerified ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="p-4 text-gray-300">{user.role}</td>
                  <td className="p-4">
                    {user.suspended ? (
                      <span className="text-red-500">Suspended</span>
                    ) : (
                      <span className="text-[#00FF00]">Active</span>
                    )}
                  </td>
                  <td className="p-4 space-x-2">
                    <button
                      onClick={() => handleSuspend(user)}
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                    >
                      Suspend
                    </button>
                    <button
                      onClick={() => window.open(`/admin/users/${user.id}/bets`, '_blank')}
                      className="bg-[#FFD700] text-black px-3 py-1 rounded text-sm hover:bg-[#FFD700]/90"
                    >
                      View Bets
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showSuspendModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1A1A1A] rounded-lg p-6 w-full max-w-md">
            <h3 className="text-white font-bold mb-4">Suspend User</h3>
            <p className="text-gray-300 mb-4">Suspending: {selectedUser.fullName}</p>
            <textarea
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="Reason for suspension"
              className="w-full bg-[#0A0A0A] border border-gray-700 rounded px-4 py-2 text-white h-24 focus:border-[#FFD700] focus:outline-none"
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={confirmSuspend}
                disabled={!suspendReason}
                className="flex-1 bg-red-600 text-white py-2 rounded font-semibold disabled:opacity-50"
              >
                Confirm Suspend
              </button>
              <button
                onClick={() => setShowSuspendModal(false)}
                className="flex-1 bg-gray-700 text-white py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;
