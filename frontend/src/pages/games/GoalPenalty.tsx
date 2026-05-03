import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useWalletStore } from '../../store/walletStore';

type Direction = 'left' | 'center' | 'right';
type Role = 'shooter' | 'goalkeeper';

interface PenaltyResult {
  success: boolean;
  direction: Direction;
  multiplier: number;
  profit: number;
}

const WEB_SOCKET_URL = 'http://localhost:5000';

const GoalPenalty = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [betAmount, setBetAmount] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>('shooter');
  const [selectedDirection, setSelectedDirection] = useState<Direction>('center');
  const [hasBet, setHasBet] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [result, setResult] = useState<PenaltyResult | null>(null);
  const [gameHistory, setGameHistory] = useState<PenaltyResult[]>([]);
  const [timeLeft, setTimeLeft] = useState(10);
  
  const balance = useWalletStore((state) => state.balance);
  const setBalance = useWalletStore((state) => state.setBalance);

  useEffect(() => {
    const newSocket = io(WEB_SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    newSocket.on('connect', () => {
      console.log('Connected to Goal Penalty game server');
      newSocket.emit('subscribe-goalpenalty');
    });

    newSocket.on('penalty-result', (data: PenaltyResult) => {
      setResult(data);
      setIsPlaying(false);
      setHasBet(false);
      setGameHistory(prev => [...prev, data].slice(-20));
      
      if (data.success) {
        setBalance(balance + data.profit);
      }
    });

    newSocket.on('countdown', (data: { timeLeft: number }) => {
      setTimeLeft(data.timeLeft);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const placeBet = () => {
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount < 1) {
      alert('Minimum bet is 1 KES');
      return;
    }

    if (amount > balance) {
      alert('Insufficient balance');
      return;
    }

    socket?.emit('place-penalty-bet', {
      amount,
      role: selectedRole,
      direction: selectedDirection,
    });

    setHasBet(true);
    setIsPlaying(true);
    setBalance(balance - amount);
  };

  const getMultiplier = (direction: Direction): number => {
    switch (direction) {
      case 'center': return 1.5;
      case 'left':
      case 'right': return 2.5;
    }
  };

  const getDirectionEmoji = (dir: Direction) => {
    switch (dir) {
      case 'left': return '⬅️';
      case 'center': return '⬆️';
      case 'right': return '➡️';
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-[#FFD700] flex items-center space-x-3">
            <span className="text-4xl">⚽</span>
            <span>Goal Penalty</span>
          </h1>
          <div className="text-xl">
            Balance: <span className="text-[#00FF00]">KES {balance.toFixed(2)}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#1A1A1A] rounded-lg p-6">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🥅</div>
              {isPlaying ? (
                <div className="text-2xl text-yellow-500">Shooting...</div>
              ) : (
                <div className="text-2xl text-gray-400">
                  {timeLeft}s until next round
                </div>
              )}
            </div>

            {result && (
              <div className={`text-center p-4 rounded-lg mb-4 ${
                result.success ? 'bg-green-900/20 border border-green-500' : 'bg-red-900/20 border border-red-500'
              }`}>
                <div className="text-3xl mb-2">
                  {result.success ? '🎉 GOAL!' : '🛑 SAVED!'}
                </div>
                <div className="text-xl">
                  Direction: {getDirectionEmoji(result.direction)} {result.direction}
                </div>
                {result.success && (
                  <div className="text-[#00FF00] font-bold">
                    Won: KES {result.profit.toFixed(2)} ({result.multiplier}x)
                  </div>
                )}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Role</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['shooter', 'goalkeeper'] as Role[]).map((role) => (
                    <button
                      key={role}
                      onClick={() => setSelectedRole(role)}
                      disabled={hasBet}
                      className={`py-3 rounded-lg font-bold transition ${
                        selectedRole === role
                          ? 'bg-[#FFD700] text-black'
                          : 'bg-[#0A0A0A] border border-gray-700 text-white hover:border-[#FFD700]'
                      } disabled:opacity-50`}
                    >
                      {role === 'shooter' ? '🦵 Shooter' : '🧤 Goalkeeper'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Direction</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['left', 'center', 'right'] as Direction[]).map((dir) => (
                    <button
                      key={dir}
                      onClick={() => setSelectedDirection(dir)}
                      disabled={hasBet}
                      className={`py-3 rounded-lg font-bold transition ${
                        selectedDirection === dir
                          ? 'bg-[#00FF00] text-black'
                          : 'bg-[#0A0A0A] border border-gray-700 text-white hover:border-[#00FF00]'
                      } disabled:opacity-50`}
                    >
                      {getDirectionEmoji(dir)} {dir}
                      <div className="text-xs mt-1">{getMultiplier(dir)}x</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Bet Amount (KES)</label>
                <input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-gray-700 rounded px-4 py-3 text-white"
                  placeholder="Min: 1 KES"
                  disabled={hasBet}
                />
              </div>

              <button
                onClick={placeBet}
                disabled={hasBet || !betAmount}
                className="w-full bg-[#FFD700] text-black py-3 rounded-lg font-bold hover:bg-[#FFD700]/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {hasBet ? 'Bet Placed' : 'Place Bet'}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-[#1A1A1A] rounded-lg p-4">
              <h3 className="text-xl font-bold mb-4">Game Rules</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start space-x-2">
                  <span className="text-[#FFD700]">•</span>
                  <span>Choose to be the Shooter or Goalkeeper</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-[#FFD700]">•</span>
                  <span>Select direction: Left (2.5x), Center (1.5x), Right (2.5x)</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-[#FFD700]">•</span>
                  <span>Shooter wins if goalkeeper guesses wrong direction</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-[#FFD700]">•</span>
                  <span>Goalkeeper wins if they guess correct direction</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-[#FFD700]">•</span>
                  <span>Minimum bet: 1 KES</span>
                </li>
              </ul>
            </div>

            <div className="bg-[#1A1A1A] rounded-lg p-4">
              <h3 className="text-xl font-bold mb-4">Recent Games</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {gameHistory.slice(-10).reverse().map((game, index) => (
                  <div
                    key={index}
                    className={`flex justify-between items-center p-3 rounded ${
                      game.success ? 'bg-green-900/20' : 'bg-red-900/20'
                    }`}
                  >
                    <span className="flex items-center space-x-2">
                      {getDirectionEmoji(game.direction)} {game.direction}
                    </span>
                    <span className={game.success ? 'text-[#00FF00]' : 'text-red-500'}>
                      {game.success ? `+${(game.profit).toFixed(2)}` : 'Lost'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoalPenalty;
