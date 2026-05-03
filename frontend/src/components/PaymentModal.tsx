import { useState } from 'react';
import axios from 'axios';
import { useWalletStore } from '../store/walletStore';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'deposit' | 'withdraw';
}

const MIN_DEPOSIT = 1;
const MIN_WITHDRAW = 100;

const PaymentModal = ({ isOpen, onClose, type }: PaymentModalProps) => {
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>(type);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ reference: string; amount: number } | null>(null);
  const balance = useWalletStore((state) => state.balance);
  const setBalance = useWalletStore((state) => state.setBalance);

  const handleDeposit = async () => {
    const depositAmount = parseFloat(amount);
    
    if (!depositAmount || depositAmount < MIN_DEPOSIT) {
      setError(`Minimum deposit is ${MIN_DEPOSIT} KES`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/wallet/deposit', {
        amount: depositAmount,
      });

      setSuccess({
        reference: response.data.transaction.reference,
        amount: depositAmount,
      });

      setBalance(balance + depositAmount);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Deposit failed');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const withdrawAmount = parseFloat(amount);
    
    if (!withdrawAmount || withdrawAmount < MIN_WITHDRAW) {
      setError(`Minimum withdrawal is ${MIN_WITHDRAW} KES`);
      return;
    }

    if (withdrawAmount > balance) {
      setError('Insufficient balance');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/wallet/withdraw', {
        amount: withdrawAmount,
      });

      setSuccess({
        reference: response.data.transaction.reference,
        amount: withdrawAmount,
      });

      setBalance(balance - withdrawAmount);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Withdrawal failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAmount('');
    setError('');
    setSuccess(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#1A1A1A] rounded-lg w-full max-w-md p-6 border border-gray-800">
        {success ? (
          <>
            <div className="text-center mb-4">
              <div className="text-[#00FF00] text-5xl mb-2">✓</div>
              <h3 className="text-xl font-bold text-white">Transaction Successful!</h3>
            </div>
            <div className="bg-[#0A0A0A] p-4 rounded mb-4">
              <p className="text-gray-300 text-sm">Reference:</p>
              <p className="text-white font-mono">{success.reference}</p>
              <p className="text-gray-300 text-sm mt-2">Amount:</p>
              <p className="text-[#FFD700] font-bold">KES {success.amount.toFixed(2)}</p>
            </div>
            <button
              onClick={handleClose}
              className="w-full bg-[#FFD700] text-black py-2 rounded font-semibold hover:bg-[#FFD700]/90 transition"
            >
              Done
            </button>
          </>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Payment</h3>
              <button onClick={handleClose} className="text-gray-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="flex mb-4">
              <button
                onClick={() => { setActiveTab('deposit'); setError(''); }}
                className={`flex-1 py-2 rounded-l ${
                  activeTab === 'deposit' ? 'bg-[#FFD700] text-black' : 'bg-[#0A0A0A] text-gray-300'
                }`}
              >
                Deposit
              </button>
              <button
                onClick={() => { setActiveTab('withdraw'); setError(''); }}
                className={`flex-1 py-2 rounded-r ${
                  activeTab === 'withdraw' ? 'bg-[#FFD700] text-black' : 'bg-[#0A0A0A] text-gray-300'
                }`}
              >
                Withdraw
              </button>
            </div>

            {error && (
              <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-4 text-sm">
                {error}
              </div>
            )}

            {activeTab === 'deposit' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Amount (KES)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={`Min: ${MIN_DEPOSIT} KES`}
                    className="w-full bg-[#0A0A0A] border border-gray-700 rounded px-4 py-2 text-white focus:border-[#FFD700] focus:outline-none"
                  />
                </div>

                <div className="bg-[#0A0A0A] p-4 rounded border border-gray-800">
                  <p className="text-gray-300 text-sm mb-2">M-Pesa STK Push:</p>
                  <p className="text-white text-sm">Enter amount and click Deposit. You'll receive a prompt on your phone.</p>
                </div>

                <div className="bg-[#0A0A0A] p-4 rounded border border-gray-800">
                  <p className="text-gray-300 text-sm mb-1">Or use Paybill:</p>
                  <p className="text-white">Paybill: <span className="font-bold text-[#FFD700]">123456</span></p>
                  <p className="text-white">Account: <span className="text-sm">{JSON.parse(localStorage.getItem('codebet_user') || '{}').phoneNumber || 'Your phone number'}</span></p>
                </div>

                <button
                  onClick={handleDeposit}
                  disabled={loading}
                  className="w-full bg-[#FFD700] text-black py-2 rounded font-semibold hover:bg-[#FFD700]/90 transition disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Deposit'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Amount (KES)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={`Min: ${MIN_WITHDRAW} KES`}
                    className="w-full bg-[#0A0A0A] border border-gray-700 rounded px-4 py-2 text-white focus:border-[#FFD700] focus:outline-none"
                  />
                </div>

                <div className="bg-[#0A0A0A] p-4 rounded border border-gray-800">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300">Available Balance:</span>
                    <span className="text-[#00FF00]">KES {balance.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Max Withdrawal:</span>
                    <span className="text-white">KES {balance.toFixed(2)}</span>
                  </div>
                  <p className="text-gray-400 text-xs mt-2">Minimum withdrawal: {MIN_WITHDRAW} KES</p>
                </div>

                <button
                  onClick={handleWithdraw}
                  disabled={loading}
                  className="w-full bg-[#00FF00] text-black py-2 rounded font-semibold hover:bg-[#00FF00]/90 transition disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Withdraw'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;
