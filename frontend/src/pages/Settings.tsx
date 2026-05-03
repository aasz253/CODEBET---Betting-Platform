import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface ResponsibleGamingSettings {
  id: string;
  dailyLossLimit: number;
  monthlyDepositLimit: number;
  coolDownUntil: string | null;
}

const Settings = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<ResponsibleGamingSettings | null>(null);
  const [dailyLossLimit, setDailyLossLimit] = useState('');
  const [monthlyDepositLimit, setMonthlyDepositLimit] = useState('');
  const [showCoolDownModal, setShowCoolDownModal] = useState(false);
  const [showSelfExclusionModal, setShowSelfExclusionModal] = useState(false);
  const [selfExclusionDuration, setSelfExclusionDuration] = useState('');
  const [showAgeWarning, setShowAgeWarning] = useState(false);
  const [showRealityCheck, setShowRealityCheck] = useState(false);
  const [realityCheckData, setRealityCheckData] = useState({ timePlayed: 0, totalWagered: 0 });
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSettings();
    checkAgeWarning();
    checkRealityCheck();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get('/api/responsible/settings');
      setSettings(response.data);
      setDailyLossLimit(response.data.dailyLossLimit.toString());
      setMonthlyDepositLimit(response.data.monthlyDepositLimit.toString());
    } catch (error: any) {
      if (error.response?.status !== 401) {
        console.error('Failed to fetch settings');
      }
    }
  };

  const checkAgeWarning = async () => {
    try {
      const response = await axios.get('/api/responsible/settings', { validateStatus: () => true });
      if (response.data?.showAgeWarning) {
        setShowAgeWarning(true);
      }
    } catch (error) {
      console.error('Failed to check age warning');
    }
  };

  const checkRealityCheck = async () => {
    try {
      const response = await axios.get('/api/responsible/reality-check');
      setRealityCheckData(response.data);
      
      // Show reality check every 60 minutes
      if (response.data.timePlayed >= 60) {
        setShowRealityCheck(true);
      }
    } catch (error) {
      console.error('Failed to check reality check');
    }
  };

  const handleUpdateSettings = async () => {
    try {
      const dailyLimit = parseFloat(dailyLossLimit);
      const monthlyLimit = parseFloat(monthlyDepositLimit);

      if (dailyLimit > Number(settings?.dailyLossLimit)) {
        alert('You can only lower your daily loss limit, not increase it.');
        return;
      }

      if (monthlyLimit > Number(settings?.monthlyDepositLimit)) {
        alert('You can only lower your monthly deposit limit, not increase it.');
        return;
      }

      await axios.put('/api/responsible/settings', {
        dailyLossLimit: dailyLimit,
        monthlyDepositLimit: monthlyLimit,
      });

      setMessage('Settings updated successfully');
      fetchSettings();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      alert('Failed to update settings');
    }
  };

  const handleCoolDown = async () => {
    try {
      await axios.post('/api/responsible/cool-down');
      setShowCoolDownModal(false);
      alert('10-minute cool-down period activated. You will be logged out.');
      localStorage.removeItem('token');
      navigate('/login');
    } catch (error) {
      alert('Failed to activate cool-down');
    }
  };

  const handleSelfExclusion = async () => {
    try {
      await axios.post('/api/responsible/self-exclusion', {
        duration: selfExclusionDuration,
      });
      setShowSelfExclusionModal(false);
      alert('Self-exclusion activated. You will be logged out.');
      localStorage.removeItem('token');
      navigate('/login');
    } catch (error) {
      alert('Failed to activate self-exclusion');
    }
  };

  const dismissAgeWarning = async () => {
    try {
      await axios.post('/api/responsible/age-warning-dismissed');
      setShowAgeWarning(false);
    } catch (error) {
      console.error('Failed to dismiss warning');
    }
  };

  const dismissRealityCheck = () => {
    setShowRealityCheck(false);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-[#FFD700] mb-6">Responsible Gaming Settings</h1>

        {message && (
          <div className="bg-green-900/20 border border-green-500 text-green-500 p-4 rounded-lg mb-6">
            {message}
          </div>
        )}

        {/* Current Limits */}
        <div className="bg-[#1A1A1A] rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Current Limits</h2>
          {settings && (
            <div className="space-y-4">
              <div>
                <span className="text-gray-400">Daily Loss Limit:</span>
                <span className="ml-2 text-[#FFD700]">KES {Number(settings.dailyLossLimit).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-400">Monthly Deposit Limit:</span>
                <span className="ml-2 text-[#FFD700]">KES {Number(settings.monthlyDepositLimit).toLocaleString()}</span>
              </div>
              {settings.coolDownUntil && (
                <div>
                  <span className="text-gray-400">Cool-down Until:</span>
                  <span className="ml-2 text-yellow-500">{new Date(settings.coolDownUntil).toLocaleString()}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Update Limits */}
        <div className="bg-[#1A1A1A] rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Update Limits (Lower Only)</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Daily Loss Limit (KES)</label>
              <input
                type="number"
                value={dailyLossLimit}
                onChange={(e) => setDailyLossLimit(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-gray-700 rounded px-4 py-3 text-white"
                placeholder="100000"
              />
              <p className="text-xs text-gray-500 mt-1">Must be less than current limit</p>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Monthly Deposit Limit (KES)</label>
              <input
                type="number"
                value={monthlyDepositLimit}
                onChange={(e) => setMonthlyDepositLimit(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-gray-700 rounded px-4 py-3 text-white"
                placeholder="500000"
              />
              <p className="text-xs text-gray-500 mt-1">Must be less than current limit</p>
            </div>
            <button
              onClick={handleUpdateSettings}
              className="bg-[#FFD700] text-black px-6 py-3 rounded-lg font-bold hover:bg-[#FFD700]/90 transition"
            >
              Update Limits
            </button>
          </div>
        </div>

        {/* Cool-down Button */}
        <div className="bg-[#1A1A1A] rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Take a Break</h2>
          <p className="text-gray-400 mb-4">Voluntarily lock your account for 10 minutes</p>
          <button
            onClick={() => setShowCoolDownModal(true)}
            className="bg-yellow-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-yellow-700 transition"
          >
            Take 10 Minute Break
          </button>
        </div>

        {/* Self-Exclusion */}
        <div className="bg-[#1A1A1A] rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 text-red-500">Self-Exclusion</h2>
          <p className="text-gray-400 mb-4">Voluntarily exclude yourself from gambling</p>
          <div className="space-y-2">
            <button
              onClick={() => { setSelfExclusionDuration('24h'); setShowSelfExclusionModal(true); }}
              className="block w-full bg-red-900/20 border border-red-500 text-red-500 px-6 py-3 rounded-lg font-bold hover:bg-red-900/40 transition"
            >
              24 Hours
            </button>
            <button
              onClick={() => { setSelfExclusionDuration('7d'); setShowSelfExclusionModal(true); }}
              className="block w-full bg-red-900/20 border border-red-500 text-red-500 px-6 py-3 rounded-lg font-bold hover:bg-red-900/40 transition"
            >
              7 Days
            </button>
            <button
              onClick={() => { setSelfExclusionDuration('permanent'); setShowSelfExclusionModal(true); }}
              className="block w-full bg-red-900/20 border border-red-500 text-red-500 px-6 py-3 rounded-lg font-bold hover:bg-red-900/40 transition"
            >
              Permanent
            </button>
          </div>
        </div>

        {/* Reality Check Info */}
        <div className="bg-[#1A1A1A] rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Reality Check</h2>
          <div className="space-y-2">
            <div>
              <span className="text-gray-400">Time Played:</span>
              <span className="ml-2 text-white">{realityCheckData.timePlayed} minutes</span>
            </div>
            <div>
              <span className="text-gray-400">Total Wagered:</span>
              <span className="ml-2 text-[#FFD700]">KES {realityCheckData.totalWagered.toLocaleString()}</span>
            </div>
            <p className="text-xs text-gray-500 mt-4">You will see a reality check popup every 60 minutes</p>
          </div>
        </div>
      </div>

      {/* Cool-down Confirmation Modal */}
      {showCoolDownModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-[#1A1A1A] p-6 rounded-lg max-w-md w-full">
            <h3 className="text-xl font-bold text-yellow-500 mb-4">Confirm 10 Minute Break</h3>
            <p className="text-gray-300 mb-6">
              Your account will be locked for 10 minutes. You will be logged out immediately.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={handleCoolDown}
                className="flex-1 bg-yellow-600 text-white py-3 rounded-lg font-bold hover:bg-yellow-700 transition"
              >
                Confirm
              </button>
              <button
                onClick={() => setShowCoolDownModal(false)}
                className="flex-1 bg-gray-700 text-white py-3 rounded-lg font-bold hover:bg-gray-600 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Self-Exclusion Confirmation Modal */}
      {showSelfExclusionModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-[#1A1A1A] p-6 rounded-lg max-w-md w-full">
            <h3 className="text-xl font-bold text-red-500 mb-4">Confirm Self-Exclusion</h3>
            <p className="text-gray-300 mb-6">
              {selfExclusionDuration === 'permanent'
                ? 'Your account will be permanently excluded. Contact support to reactivate.'
                : `Your account will be excluded for ${selfExclusionDuration === '24h' ? '24 hours' : '7 days'}.`}
              {' '}You will be logged out immediately.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={handleSelfExclusion}
                className="flex-1 bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition"
              >
                Confirm
              </button>
              <button
                onClick={() => setShowSelfExclusionModal(false)}
                className="flex-1 bg-gray-700 text-white py-3 rounded-lg font-bold hover:bg-gray-600 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Age Warning Popup */}
      {showAgeWarning && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-[#1A1A1A] p-8 rounded-lg max-w-lg w-full">
            <h3 className="text-2xl font-bold text-[#FFD700] mb-4">Age Verification</h3>
            <p className="text-gray-300 mb-6 text-lg">
              You confirm you are over 18 years old. Gambling can be addictive. Play responsibly.
            </p>
            <div className="bg-yellow-900/20 border border-yellow-500 p-4 rounded mb-6">
              <p className="text-yellow-500 text-sm">
                If you or someone you know has a gambling problem, call 1-800-GAMBLER or visit www.gamcare.org
              </p>
            </div>
            <button
              onClick={dismissAgeWarning}
              className="w-full bg-[#00FF00] text-black py-3 rounded-lg font-bold hover:bg-[#00FF00]/90 transition"
            >
              I Understand
            </button>
          </div>
        </div>
      )}

      {/* Reality Check Popup */}
      {showRealityCheck && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-[#1A1A1A] p-8 rounded-lg max-w-lg w-full">
            <h3 className="text-2xl font-bold text-[#FFD700] mb-4">Reality Check</h3>
            <div className="space-y-4 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-400">Time Played:</span>
                <span className="text-white">{realityCheckData.timePlayed} minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Wagered:</span>
                <span className="text-[#FFD700]">KES {realityCheckData.totalWagered.toLocaleString()}</span>
              </div>
            </div>
            <p className="text-gray-300 mb-6">Remember to play responsibly. Take breaks and set limits.</p>
            <button
              onClick={dismissRealityCheck}
              className="w-full bg-[#FFD700] text-black py-3 rounded-lg font-bold hover:bg-[#FFD700]/90 transition"
            >
              Continue Playing
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
