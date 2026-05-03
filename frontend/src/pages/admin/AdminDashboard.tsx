import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import ManageUsers from './ManageUsers';
import OddsControl from './OddsControl';
import BetLimits from './BetLimits';
import AuditLog from './AuditLog';

interface DashboardStats {
  totalUsers: number;
  activeBets: number;
  totalVolume: number;
  totalPayouts: number;
  dailyVolume: { date: string; volume: number }[];
}

const fetchDashboardStats = async (): Promise<DashboardStats> => {
  const response = await fetch('/api/admin/dashboard', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('codebet_token')}`,
    },
  });
  return response.json();
};

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'odds' | 'limits' | 'audit'>('dashboard');
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['adminDashboard'],
    queryFn: fetchDashboardStats,
  });

  const user = JSON.parse(localStorage.getItem('codebet_user') || '{}');
  
  if (user.role !== 'ADMIN') {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-[#FFD700] mb-6">Admin Dashboard</h1>

        <div className="flex space-x-1 mb-6">
          {(['dashboard', 'users', 'odds', 'limits', 'audit'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded ${
                activeTab === tab
                  ? 'bg-[#FFD700] text-black font-semibold'
                  : 'bg-[#1A1A1A] text-gray-300 hover:text-white'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === 'dashboard' && (
          <div>
            {isLoading ? (
              <div className="text-white">Loading...</div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-[#1A1A1A] p-4 rounded-lg border border-gray-800">
                    <p className="text-gray-400 text-sm">Total Users</p>
                    <p className="text-2xl font-bold text-white">{data?.totalUsers}</p>
                  </div>
                  <div className="bg-[#1A1A1A] p-4 rounded-lg border border-gray-800">
                    <p className="text-gray-400 text-sm">Active Bets</p>
                    <p className="text-2xl font-bold text-[#FFD700]">{data?.activeBets}</p>
                  </div>
                  <div className="bg-[#1A1A1A] p-4 rounded-lg border border-gray-800">
                    <p className="text-gray-400 text-sm">Total Volume</p>
                    <p className="text-2xl font-bold text-white">KES {data?.totalVolume?.toFixed(2)}</p>
                  </div>
                  <div className="bg-[#1A1A1A] p-4 rounded-lg border border-gray-800">
                    <p className="text-gray-400 text-sm">Total Payouts</p>
                    <p className="text-2xl font-bold text-[#00FF00]">KES {data?.totalPayouts?.toFixed(2)}</p>
                  </div>
                </div>

                <div className="bg-[#1A1A1A] p-4 rounded-lg border border-gray-800">
                  <h3 className="text-white font-bold mb-4">Daily Volume (Last 7 Days)</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data?.dailyVolume || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="date" stroke="#888" />
                      <YAxis stroke="#888" />
                      <Tooltip contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #333' }} />
                      <Legend />
                      <Bar dataKey="volume" fill="#FFD700" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'users' && <ManageUsers />}
        {activeTab === 'odds' && <OddsControl />}
        {activeTab === 'limits' && <BetLimits />}
        {activeTab === 'audit' && <AuditLog />}
      </div>
    </div>
  );
};

export default AdminDashboard;
