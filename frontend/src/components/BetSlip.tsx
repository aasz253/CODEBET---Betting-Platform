import { useState } from 'react';
import { useBetslipStore } from '../store/betslipStore';
import axios from 'axios';

const MULTIPLIERS = [10, 20, 50, 100, 200, 500, 1000, 5000];

const BetSlip = () => {
  const bets = useBetslipStore((state) => state.bets);
  const updateStake = useBetslipStore((state) => state.updateStake);
  const removeBet = useBetslipStore((state) => state.removeBet);
  const clearBetslip = useBetslipStore((state) => state.clearBetslip);
  const getTotalStake = useBetslipStore((state) => state.getTotalStake);
  const getTotalPotentialWin = useBetslipStore((state) => state.getTotalPotentialWin);

  const [customAmount, setCustomAmount] = useState('');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ reference: string; amount: number } | null>(null);

  const totalStake = getTotalStake();
  const totalPotentialWin = getTotalPotentialWin();

  const handleMultiplierClick = (multiplier: number) => {
    if (bets.length === 0) return;
    const stakePerBet = multiplier / bets.length;
    bets.forEach((_, index) => {
      updateStake(index, stakePerBet);
    });
  };

  const handleCustomAmount = () => {
    const amount = parseFloat(customAmount);
    if (isNaN(amount) || amount <= 0) return;
    if (bets.length === 0) return;
    const stakePerBet = amount / bets.length;
    bets.forEach((_, index) => {
      updateStake(index, stakePerBet);
    });
    setCustomAmount('');
  };

  const handlePlaceBet = async () => {
    if (bets.length === 0) return;
    setPlacing(true);
    setError('');

    try {
      const response = await axios.post('/api/bets/slip', {
        userId: JSON.parse(localStorage.getItem('codebet_user') || '{}').id,
        bets: bets.map(bet => ({
          eventId: bet.eventId,
          marketId: bet.marketId,
          oddsValue: bet.oddsValue,
          stake: bet.stake || 0,
        })),
        betType: 'SINGLE',
      });

      await axios.post('/api/bets/place', {
        betSlipId: response.data.betSlip.id,
      });

      setSuccess({
        reference: response.data.transaction?.reference || 'BET-' + Date.now(),
        amount: totalStake,
      });
      clearBetslip();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to place bet');
    } finally {
      setPlacing(false);
    }
  };

  if (bets.length === 0) {
    return (
      <div className="bg-[#1A1A1A] w-80 border-l border-gray-800 p-4">
        <h3 className="text-white font-bold mb-4">BetSlip</h3>
        <p className="text-gray-400 text-center mt-10">No bets added</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1A1A1A] w-80 border-l border-gray-800 p-4 flex flex-col h-screen">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white font-bold">BetSlip ({bets.length})</h3>
        <button
          onClick={clearBetslip}
          className="text-gray-400 hover:text-white text-sm"
        >
          Clear All
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {bets.map((bet, index) => (
          <div key={index} className="bg-[#0A0A0A] p-3 rounded mb-2">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-white text-sm font-semibold">
                  {bet.homeTeam} vs {bet.awayTeam}
                </p>
                <p className="text-gray-400 text-xs">{bet.marketType}</p>
              </div>
              <button
                onClick={() => removeBet(index)}
                className="text-gray-400 hover:text-red-500"
              >
                ✕
              </button>
            </div>
            
            <div className="flex justify-between items-center">
              <span className={`font-bold ${bet.oddsChanged ? 'text-yellow-300 animate-pulse' : 'text-[#FFD700]'}`}>
                {bet.oddsValue.toFixed(2)}
                {bet.oddsChanged && bet.previousOdds && (
                  <span className="text-xs text-gray-400 ml-1">
                    (was {bet.previousOdds.toFixed(2)})
                  </span>
                )}
              </span>
              <input
                type="number"
                value={bet.stake || ''}
                onChange={(e) => updateStake(index, parseFloat(e.target.value) || 0)}
                placeholder="Stake"
                className="bg-[#1A1A1A] border border-gray-700 rounded px-2 py-1 w-20 text-white text-sm focus:border-[#FFD700] focus:outline-none"
              />
            </div>
            
            {bet.stake && (
              <p className="text-[#00FF00] text-xs mt-1">
                Win: {(bet.stake * bet.oddsValue).toFixed(2)}
                {bet.oddsChanged && (
                  <span className="text-yellow-300 ml-1">⚠ Odds changed!</span>
                )}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-gray-800 pt-4">
        <div className="grid grid-cols-4 gap-1 mb-2">
          {MULTIPLIERS.map((mult) => (
            <button
              key={mult}
              onClick={() => handleMultiplierClick(mult)}
              className="bg-[#0A0A0A] border border-gray-700 text-white text-xs py-1 rounded hover:border-[#FFD700] transition"
            >
              {mult}
            </button>
          ))}
        </div>

        <div className="flex space-x-1 mb-4">
          <input
            type="number"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            placeholder="Custom"
            className="flex-1 bg-[#0A0A0A] border border-gray-700 rounded px-2 py-1 text-white text-sm focus:border-[#FFD700] focus:outline-none"
          />
          <button
            onClick={handleCustomAmount}
            className="bg-[#FFD700] text-black px-3 py-1 rounded text-sm font-semibold"
          >
            Set
          </button>
        </div>

        <div className="space-y-1 mb-4 text-sm">
          <div className="flex justify-between text-gray-300">
            <span>Total Stake:</span>
            <span className="text-white">{totalStake.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-300">
            <span>Potential Win:</span>
            <span className="text-[#00FF00] font-bold">{totalPotentialWin.toFixed(2)}</span>
          </div>
        </div>

        {error && (
          <p className="text-red-500 text-xs mb-2">{error}</p>
        )}

        {success && (
          <div className="bg-green-900/50 border border-green-500 text-green-200 px-3 py-2 rounded mb-2 text-xs">
            Bet placed! Ref: {success.reference}
          </div>
        )}

        <button
          onClick={handlePlaceBet}
          disabled={placing || totalStake === 0}
          className="w-full bg-[#FFD700] text-black py-2 rounded font-semibold hover:bg-[#FFD700]/90 transition disabled:opacity-50"
        >
          {placing ? 'Placing...' : `Place Bet (${totalStake.toFixed(2)})`}
        </button>
      </div>
    </div>
  );
};

export default BetSlip;
