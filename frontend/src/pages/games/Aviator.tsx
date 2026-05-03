import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useWalletStore } from '../../store/walletStore';

interface PlayerBet {
  userName: string;
  amount: number;
  cashOutAt?: number;
  profit?: number;
}

const WEB_SOCKET_URL = 'http://localhost:5000';

const Aviator = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [multiplier, setMultiplier] = useState(1.00);
  const [isRunning, setIsRunning] = useState(false);
  const [hasCrashed, setHasCrashed] = useState(false);
  const [nextCrash, setNextCrash] = useState<number | null>(null);
  const [betAmount, setBetAmount] = useState('');
  const [hasBet, setHasBet] = useState(false);
  const [cashOutAt, setCashOutAt] = useState<number | null>(null);
  const [profit, setProfit] = useState(0);
  const [players, setPlayers] = useState<PlayerBet[]>([]);
  const [timeLeft, setTimeLeft] = useState(15);
  const [gameHistory, setGameHistory] = useState<{ multiplier: number; cashed: boolean }[]>([]);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const balance = useWalletStore((state) => state.balance);
  const deductBalance = useWalletStore((state) => state.deductBalance);
  const setBalance = useWalletStore((state) => state.setBalance);

  useEffect(() => {
    const newSocket = io(WEB_SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to Aviator game server');
      newSocket.emit('subscribe-aviator');
    });

    newSocket.on('game-started', (data: { crashPoint: number; startTime: string }) => {
      setNextCrash(null);
      setIsRunning(true);
      setHasCrashed(false);
      setMultiplier(1.00);
      startTimeRef.current = Date.now();
      startAnimation(data.crashPoint);
    });

    newSocket.on('multiplier-update', (data: { multiplier: number }) => {
      setMultiplier(data.multiplier);
    });

    newSocket.on('game-crashed', (data: { crashPoint: number }) => {
      setIsRunning(false);
      setHasCrashed(true);
      cancelAnimationFrame(animationRef.current);
      drawCrashOnCanvas(data.crashPoint);
    });

    newSocket.on('player-cashed-out', (data: { userName: string; multiplier: number; profit: number }) => {
      setPlayers((prev) => [...prev, { 
        userName: data.userName, 
        amount: 0, 
        cashOutAt: data.multiplier, 
        profit: data.profit 
      }]);
    });

    newSocket.on('next-game', (data: { crashPoint: number }) => {
      setNextCrash(data.crashPoint);
      setTimeLeft(15 + Math.floor(Math.random() * 15));
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const startAnimation = (crash: number) => {
    const duration = 15000 + (crash - 1) * 100;
    
    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const currentMultiplier = 1 + (crash - 1) * progress;

      if (currentMultiplier >= crash || progress >= 1) {
        return;
      }

      setMultiplier(parseFloat(currentMultiplier.toFixed(2)));
      drawGraphOnCanvas(currentMultiplier);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  const drawGraphOnCanvas = (currentMultiplier: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const points = [...gameHistory, { multiplier: currentMultiplier, cashed: false }];
    
    points.forEach((point, index) => {
      const x = (index / points.length) * canvas.width;
      const y = canvas.height - (point.multiplier / 1000) * canvas.height;
      
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = point.cashed ? '#00FF00' : '#FF0000';
      ctx.fill();
    });
  };

  const drawCrashOnCanvas = (crashMultiplier: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#FF0000';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('CRASHED', canvas.width / 2, canvas.height / 2);
    ctx.fillText(`${crashMultiplier.toFixed(2)}x`, canvas.width / 2, canvas.height / 2 + 60);
  };

  const placeBet = () => {
    const amount = parseFloat(betAmount);
    if (!amount || amount < 1) {
      alert('Minimum bet is 1 KES');
      return;
    }
    if (amount > balance) {
      alert('Insufficient balance');
      return;
    }

    socket?.emit('place-bet', { amount });
    setHasBet(true);
    deductBalance(amount);
    setGameHistory((prev) => [...prev, { multiplier: 0, cashed: false }]);
  };

  const cashOut = () => {
    if (!isRunning || !hasBet) return;
    socket?.emit('cash-out');
    setCashOutAt(multiplier);
    setIsRunning(false);
    const winAmount = parseFloat(betAmount) * multiplier;
    setProfit(winAmount - parseFloat(betAmount));
    setBalance(balance + winAmount);
    
    // Play cashout sound
    playSound('cashout');
  };

  const playSound = (type: 'cashout' | 'crash') => {
    const audio = new Audio(type === 'cashout' ? '/sounds/cashout.mp3' : '/sounds/crash.mp3');
    audio.play().catch(() => {});
  };

  useEffect(() => {
    if (hasCrashed && hasBet && !cashOutAt) {
      setProfit(-parseFloat(betAmount || '0'));
      playSound('crash');
    }
  }, [hasCrashed, hasBet, cashOutAt, betAmount]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-[#FFD700] mb-6">Aviator</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Game Area */}
          <div className="lg:col-span-2">
            <div className="bg-[#1A1A1A] rounded-lg p-6 mb-6">
              {/* Multiplier Display */}
              <div className="text-center mb-6">
                <div className={`text-9xl font-bold ${
                  hasCrashed ? 'text-red-600' : isRunning ? 'text-[#00FF00] animate-pulse' : 'text-white'
                }`}>
                  {multiplier.toFixed(2)}x
                </div>
                {nextCrash && !isRunning && !hasCrashed && (
                  <p className="text-gray-400 mt-2">Next round in {timeLeft} seconds</p>
                )}
              </div>

              {/* Canvas for Graph */}
              <canvas
                ref={canvasRef}
                width={800}
                height={300}
                className="w-full bg-[#0A0A0A] rounded mb-6"
              />

              {/* Bet Controls */}
              <div className="flex gap-4">
                <input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  placeholder="Bet (min: 1 KES)"
                  disabled={isRunning || hasBet}
                  className="flex-1 bg-[#0A0A0A] border border-gray-700 rounded px-4 py-3 text-white focus:border-[#FFD700] focus:outline-none disabled:opacity-50"
                />
                {!hasBet ? (
                  <button
                    onClick={placeBet}
                    disabled={!betAmount || parseFloat(betAmount) < 1 || isRunning}
                    className="bg-[#FFD700] text-black px-8 py-3 rounded font-bold hover:bg-[#FFD700]/90 transition disabled:opacity-50"
                  >
                    Place Bet
                  </button>
                ) : !cashOutAt && !hasCrashed ? (
                  <button
                    onClick={cashOut}
                    disabled={!isRunning}
                    className="bg-[#00FF00] text-black px-8 py-3 rounded font-bold text-xl hover:bg-[#00FF00]/90 transition animate-pulse disabled:opacity-50"
                  >
                    CASH OUT ({multiplier.toFixed(2)}x)
                  </button>
                ) : null}
              </div>

              {hasBet && !cashOutAt && !hasCrashed && (
                <div className="mt-4 p-4 bg-[#0A0A0A] rounded">
                  <p className="text-[#00FF00]">Bet: {betAmount} KES</p>
                  <p className="text-white">Potential win: {(parseFloat(betAmount) * multiplier).toFixed(2)} KES</p>
                </div>
              )}

              {cashOutAt && (
                <div className="mt-4 p-4 bg-[#00FF00]/20 border border-[#00FF00] rounded">
                  <p className="text-[#00FF00] text-xl">Cashed out at {cashOutAt.toFixed(2)}x</p>
                  <p className="text-white">Profit: {profit.toFixed(2)} KES</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Players */}
          <div className="bg-[#1A1A1A] rounded-lg p-6">
            <h3 className="text-white font-bold mb-4">Top Cashouts</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {players
                .filter(p => p.cashOutAt)
                .sort((a, b) => (b.cashOutAt || 0) - (a.cashOutAt || 0))
                .slice(0, 10)
                .map((player, index) => (
                  <div key={index} className="bg-[#0A0A0A] p-3 rounded flex justify-between">
                    <span className="text-white text-sm">{player.userName}</span>
                    <span className="text-[#00FF00] font-bold">{player.cashOutAt?.toFixed(2)}x</span>
                  </div>
                ))}
            </div>

            <div className="mt-6">
              <h4 className="text-gray-400 text-sm mb-2">Game History</h4>
              <div className="flex flex-wrap gap-1">
                {gameHistory.slice(-20).reverse().map((game, index) => (
                  <div
                    key={index}
                    className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold ${
                      game.cashed ? 'bg-[#00FF00] text-black' : 'bg-red-600 text-white'
                    }`}
                  >
                    {game.multiplier.toFixed(1)}x
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 p-4 bg-[#0A0A0A] rounded">
              <p className="text-gray-400 text-sm">Balance</p>
              <p className="text-[#00FF00] text-xl font-bold">{balance.toFixed(2)} KES</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Aviator;
