import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useWalletStore } from '../../store/walletStore';

interface PlayerBet {
  userName: string;
  amount: number;
  cashOutAt?: number;
  profit?: number;
}

interface CrashGameBaseProps {
  gameTitle: string;
  gameIcon: string;
  backgroundColor: string;
  animationType: 'rocket' | 'helicopter' | 'comet';
  gameType: 'aviator' | 'jetx' | 'aviatrix' | 'crashcomet';
}

const WEB_SOCKET_URL = 'http://localhost:5000';

const CrashGameBase = ({ gameTitle, gameIcon, backgroundColor, animationType, gameType }: CrashGameBaseProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [multiplier, setMultiplier] = useState(1.00);
  const [isRunning, setIsRunning] = useState(false);
  const [hasCrashed, setHasCrashed] = useState(false);
  const [betAmount, setBetAmount] = useState('');
  const [hasBet, setHasBet] = useState(false);
  const [cashOutAt, setCashOutAt] = useState<number | null>(null);
  const [profit, setProfit] = useState(0);
  const [players, setPlayers] = useState<PlayerBet[]>([]);
  const [timeLeft, setTimeLeft] = useState(15);
  const gameHistory: { multiplier: number; cashed: boolean }[] = [];
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const balance = useWalletStore((state) => state.balance);
  const setBalance = useWalletStore((state) => state.setBalance);

  useEffect(() => {
    const newSocket = io(WEB_SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    newSocket.on('connect', () => {
      console.log(`Connected to ${gameTitle} game server`);
      newSocket.emit(`subscribe-${gameType}`);
    });

    newSocket.on('game-started', (data: { crashPoint: number; startTime: string }) => {
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

    newSocket.on('next-game', (_data: { crashPoint: number }) => {
      setTimeLeft(15);
      setHasBet(false);
      setCashOutAt(null);
      setProfit(0);
    });

    newSocket.on('bet-placed', (data: { userName: string; amount: number }) => {
      setPlayers((prev) => [...prev, { userName: data.userName, amount: data.amount }]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [gameTitle, gameType]);

  const startAnimation = (crashPoint: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const currentMultiplier = Math.exp(elapsed * Math.log(crashPoint) / 10);
      
      if (currentMultiplier >= crashPoint) {
        setHasCrashed(true);
        setIsRunning(false);
        return;
      }

      setMultiplier(parseFloat(currentMultiplier.toFixed(2)));
      drawOnCanvas(ctx, canvas, currentMultiplier);
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();
  };

  const drawOnCanvas = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, currentMult: number) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, backgroundColor);
    gradient.addColorStop(1, '#0A0A0A');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${currentMult.toFixed(2)}x`, canvas.width / 2, canvas.height / 2);

    drawAnimation(ctx, canvas, currentMult, animationType);
  };

  const drawAnimation = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, multiplier: number, type: string) => {
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2 - 60);
    
    const scale = Math.min(multiplier / 10, 2);
    ctx.scale(scale, scale);

    switch (type) {
      case 'rocket':
        drawRocket(ctx);
        break;
      case 'helicopter':
        drawHelicopter(ctx);
        break;
      case 'comet':
        drawComet(ctx);
        break;
    }
    
    ctx.restore();
  };

  const drawRocket = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(0, -30);
    ctx.lineTo(-15, 20);
    ctx.lineTo(15, 20);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#FF6B6B';
    ctx.fillRect(-5, 20, 10, 15);
  };

  const drawHelicopter = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#00FF00';
    ctx.fillRect(-20, -10, 40, 20);
    
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(-25, -5, 10, 10);
    ctx.fillRect(15, -5, 10, 10);
    
    ctx.fillStyle = '#FF69B4';
    ctx.beginPath();
    ctx.arc(0, -15, 10, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawComet = (ctx: CanvasRenderingContext2D) => {
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 30);
    gradient.addColorStop(0, '#00FFFF');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawCrashOnCanvas = (crashPoint: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#FF0000';
    ctx.font = 'bold 64px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('CRASH!', canvas.width / 2, canvas.height / 2);
    ctx.font = 'bold 32px Arial';
    ctx.fillText(`${crashPoint.toFixed(2)}x`, canvas.width / 2, canvas.height / 2 + 50);
  };

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

    socket?.emit('place-bet', { amount, gameType });
    setHasBet(true);
    setBalance(balance - amount);
  };

  const cashOut = () => {
    if (!hasBet || !isRunning) return;

    const cashOutMultiplier = multiplier;
    const betAmountNum = parseFloat(betAmount);
    const winAmount = betAmountNum * cashOutMultiplier;
    const profitAmount = winAmount - betAmountNum;

    socket?.emit('cash-out', { multiplier: cashOutMultiplier, gameType });
    setCashOutAt(cashOutMultiplier);
      setProfit(profitAmount);
      setBalance(balance + winAmount);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-[#FFD700] flex items-center space-x-3">
            <span className="text-4xl">{gameIcon}</span>
            <span>{gameTitle}</span>
          </h1>
          <div className="text-xl">
            Balance: <span className="text-[#00FF00]">KES {balance.toFixed(2)}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-[#1A1A1A] rounded-lg p-4 mb-4">
              <canvas
                ref={canvasRef}
                width={800}
                height={400}
                className="w-full rounded"
                style={{ background: `linear-gradient(135deg, ${backgroundColor}, #0A0A0A)` }}
              />
            </div>

            <div className="bg-[#1A1A1A] rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-6xl font-bold text-[#FFD700]">
                    {multiplier.toFixed(2)}x
                  </div>
                  {isRunning && (
                    <div className="text-green-500">RUNNING</div>
                  )}
                  {hasCrashed && (
                    <div className="text-red-500">CRASHED</div>
                  )}
                </div>

                <div className="text-right">
                  <div className="text-2xl mb-2">
                    {isRunning ? 'Cash Out At:' : 'Next Round In:'}
                  </div>
                  {isRunning ? (
                    <div className="text-4xl font-bold text-[#00FF00]">
                      {multiplier.toFixed(2)}x
                    </div>
                  ) : (
                    <div className="text-4xl font-bold text-yellow-500">
                      {timeLeft}s
                    </div>
                  )}
                </div>
              </div>

              {hasBet && !cashOutAt && isRunning && (
                <button
                  onClick={cashOut}
                  className="w-full bg-[#00FF00] text-black py-4 rounded-lg font-bold text-xl hover:bg-[#00FF00]/90 transition mb-4"
                >
                  CASH OUT @ {multiplier.toFixed(2)}x
                </button>
              )}

              {cashOutAt && (
                <div className="bg-green-900/20 border border-green-500 rounded-lg p-4 mb-4">
                  <div className="text-green-500 font-bold">Cashed Out at {cashOutAt.toFixed(2)}x</div>
                  <div className="text-[#00FF00]">Profit: KES {profit.toFixed(2)}</div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-[#1A1A1A] rounded-lg p-4">
              <h3 className="text-xl font-bold mb-4">Place Bet</h3>
              
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">Bet Amount (KES)</label>
                <input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-gray-700 rounded px-4 py-3 text-white"
                  placeholder="Min: 1 KES"
                  disabled={hasBet || isRunning}
                />
              </div>

              <div className="grid grid-cols-4 gap-2 mb-4">
                {[10, 50, 100, 500].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setBetAmount(amount.toString())}
                    className="bg-[#0A0A0A] border border-gray-700 rounded py-2 hover:border-[#FFD700] transition"
                    disabled={hasBet || isRunning}
                  >
                    {amount}
                  </button>
                ))}
              </div>

              <button
                onClick={placeBet}
                disabled={hasBet || isRunning || !betAmount}
                className="w-full bg-[#FFD700] text-black py-3 rounded-lg font-bold hover:bg-[#FFD700]/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {hasBet ? 'Bet Placed' : 'Place Bet'}
              </button>
            </div>

            <div className="bg-[#1A1A1A] rounded-lg p-4">
              <h3 className="text-xl font-bold mb-4">Players</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {players.map((player, index) => (
                  <div key={index} className="flex justify-between items-center bg-[#0A0A0A] p-3 rounded">
                    <span>{player.userName}</span>
                    {player.cashOutAt ? (
                      <span className="text-[#00FF00]">
                        {player.cashOutAt.toFixed(2)}x (+{player.profit?.toFixed(2)})
                      </span>
                    ) : (
                      <span className="text-yellow-500">{player.amount} KES</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#1A1A1A] rounded-lg p-4">
              <h3 className="text-xl font-bold mb-4">Game History</h3>
              <div className="flex flex-wrap gap-2">
                {gameHistory.slice(-20).reverse().map((game: { multiplier: number; cashed: boolean }, index: number) => (
                  <div
                    key={index}
                    className={`px-3 py-1 rounded ${
                      game.cashed ? 'bg-green-900 text-green-500' : 'bg-red-900 text-red-500'
                    }`}
                  >
                    {game.multiplier.toFixed(2)}x
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

export default CrashGameBase;
