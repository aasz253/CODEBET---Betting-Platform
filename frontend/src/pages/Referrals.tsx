import { useState, useEffect } from 'react';
import axios from 'axios';

interface ReferralStats {
  totalReferrals: number;
  creditedReferrals: number;
  pendingReferrals: number;
  totalBonusEarned: number;
  referrals: Array<{
    name: string;
    date: string;
    status: string;
    bonus: number;
  }>;
}

interface Bonus {
  id: string;
  type: string;
  amount: number;
  wageringRequirement: number;
  wageredAmount: number;
  remainingWager: number;
  expiresAt?: string;
}

const Referrals = () => {
  const [referralCode, setReferralCode] = useState('');
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchReferralCode();
    fetchStats();
    fetchBonuses();
  }, []);

  const fetchReferralCode = async () => {
    try {
      const response = await axios.get('/api/referral/code');
      setReferralCode(response.data.referralCode);
    } catch (error) {
      console.error('Failed to fetch referral code');
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/referral/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats');
    }
  };

  const fetchBonuses = async () => {
    try {
      const response = await axios.get('/api/referral/bonuses');
      setBonuses(response.data.bonuses || []);
    } catch (error) {
      console.error('Failed to fetch bonuses');
    } finally {
      setLoading(false);
    }
  };

  const shareViaWhatsApp = () => {
    const message = `Join CODEBET using my referral code ${referralCode} and get a welcome bonus! https://codebet.com/register?ref=${referralCode}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const shareViaSMS = () => {
    const message = `Join CODEBET using my referral code ${referralCode} and get a welcome bonus! https://codebet.com/register?ref=${referralCode}`;
    window.open(`sms:?body=${encodeURIComponent(message)}`);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setMessage('Referral code copied to clipboard!');
    setTimeout(() => setMessage(''), 3000);
  };

  const getBonusTypeLabel = (type: string) => {
    switch (type) {
      case 'WELCOME': return 'Welcome Bonus';
      case 'DEPOSIT': return 'Deposit Bonus';
      case 'REFERRAL': return 'Referral Bonus';
      case 'CASHBACK': return 'Cashback';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white p-6 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-[#FFD700] mb-6">Referral Program</h1>

        {message && (
          <div className="bg-green-900/20 border border-green-500 text-green-500 p-4 rounded-lg mb-6">
            {message}
          </div>
        )}

        {/* Referral Code Section */}
        <div className="bg-[#1A1A1A] rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Your Referral Code</h2>
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex-1 bg-[#0A0A0A] border border-gray-700 rounded px-4 py-3 font-mono text-2xl text-[#FFD700]">
              {referralCode}
            </div>
            <button
              onClick={copyCode}
              className="bg-[#FFD700] text-black px-6 py-3 rounded-lg font-bold hover:bg-[#FFD700]/90 transition"
            >
              Copy
            </button>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={shareViaWhatsApp}
              className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition"
            >
              Share via WhatsApp
            </button>
            <button
              onClick={shareViaSMS}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition"
            >
              Share via SMS
            </button>
          </div>
        </div>

        {/* Stats Section */}
        {stats && (
          <div className="bg-[#1A1A1A] rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Referral Statistics</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-[#FFD700]">{stats.totalReferrals}</p>
                <p className="text-gray-400 text-sm">Total Referrals</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-500">{stats.creditedReferrals}</p>
                <p className="text-gray-400 text-sm">Credited</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-yellow-500">{stats.pendingReferrals}</p>
                <p className="text-gray-400 text-sm">Pending</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-[#00FF00]">{stats.totalBonusEarned.toLocaleString()}</p>
                <p className="text-gray-400 text-sm">Bonus Earned (KES)</p>
              </div>
            </div>

            <h3 className="text-lg font-bold mb-3">Referred Friends</h3>
            <div className="space-y-2">
              {stats.referrals.map((referral, index) => (
                <div key={index} className="flex justify-between items-center bg-[#0A0A0A] p-3 rounded">
                  <div>
                    <p className="text-white">{referral.name}</p>
                    <p className="text-gray-400 text-sm">{new Date(referral.date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded text-xs ${
                      referral.status === 'CREDITED' ? 'bg-green-900 text-green-500' : 'bg-yellow-900 text-yellow-500'
                    }`}>
                      {referral.status}
                    </span>
                    {referral.bonus > 0 && (
                      <p className="text-[#00FF00] text-sm mt-1">+{referral.bonus} KES</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Bonuses */}
        <div className="bg-[#1A1A1A] rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Active Bonuses</h2>
          {bonuses.length === 0 ? (
            <p className="text-gray-400">No active bonuses</p>
          ) : (
            <div className="space-y-4">
              {bonuses.map((bonus) => (
                <div key={bonus.id} className="bg-[#0A0A0A] p-4 rounded border border-gray-700">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-bold text-white">{getBonusTypeLabel(bonus.type)}</p>
                      <p className="text-gray-400 text-sm">
                        Expires: {bonus.expiresAt ? new Date(bonus.expiresAt).toLocaleDateString() : 'Never'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-[#FFD700]">{bonus.amount} KES</p>
                    </div>
                  </div>

                  <div className="mb-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Wagering Progress</span>
                      <span className="text-gray-300">
                        {bonus.wageredAmount.toLocaleString()} / {bonus.wageringRequirement.toLocaleString()} KES
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-[#00FF00] h-2 rounded-full transition-all"
                        style={{ width: `${Math.min((bonus.wageredAmount / bonus.wageringRequirement) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {bonus.remainingWager} KES remaining to wager
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bonus Information */}
        <div className="mt-6 bg-[#1A1A1A] rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Bonus Information</h2>
          <div className="space-y-4 text-gray-300">
            <div>
              <h3 className="font-bold text-white mb-2">Welcome Bonus</h3>
              <p>New users get 100 KES free bet after first deposit of 100 KES. Wagering requirement: 3x.</p>
            </div>
            <div>
              <h3 className="font-bold text-white mb-2">Referral Bonus</h3>
              <p>Earn 5,000 KES for each friend who signs up using your referral code. Friend must make a deposit of at least 100 KES.</p>
            </div>
            <div>
              <h3 className="font-bold text-white mb-2">Friday Deposit Bonus</h3>
              <p>Get 50% match up to 5,000 KES on every Friday deposit. Wagering requirement: 3x.</p>
            </div>
            <div className="bg-yellow-900/20 border border-yellow-500 p-4 rounded">
              <p className="text-yellow-500 text-sm">
                All bonuses have wagering requirements that must be met before winnings can be withdrawn. Bonuses expire after 30 days if not used.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Referrals;
