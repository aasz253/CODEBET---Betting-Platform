import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

interface MatchEvent {
  type: 'GOAL' | 'CARD' | 'SUBSTITUTION';
  minute: number;
  team: 'HOME' | 'AWAY';
  player: string;
  detail?: string;
}

interface LiveMatch {
  id: string;
  eventId: string;
  homeScore: number;
  awayScore: number;
  matchTime: number;
  status: string;
  events: MatchEvent[];
  homePossession: number;
  awayPossession: number;
  homeShots: number;
  awayShots: number;
  homeCorners: number;
  awayCorners: number;
}

interface LiveMatchTrackerProps {
  eventId: string;
  homeTeam: string;
  awayTeam: string;
}

const LiveMatchTracker = ({ eventId, homeTeam, awayTeam }: LiveMatchTrackerProps) => {
  const [match, setMatch] = useState<LiveMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetchMatchData();
    const interval = setInterval(fetchMatchData, 10000);
    return () => clearInterval(interval);
  }, [eventId]);

  useEffect(() => {
    if (match) {
      drawPossession();
    }
  }, [match]);

  const fetchMatchData = async () => {
    try {
      const response = await axios.get(`/api/events/${eventId}/live`);
      setMatch(response.data);
    } catch (error) {
      console.error('Failed to fetch live match:', error);
    } finally {
      setLoading(false);
    }
  };

  const drawPossession = () => {
    const canvas = canvasRef.current;
    if (!canvas || !match) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Home team possession
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(0, 0, width * (match.homePossession / 100), height);

    // Away team possession
    ctx.fillStyle = '#00FF00';
    ctx.fillRect(width * (match.homePossession / 100), 0, width * (match.awayPossession / 100), height);

    // Center line
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();

    // Text
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${match.homePossession}%`, width / 4, height / 2 + 5);
    ctx.fillText(`${match.awayPossession}%`, 3 * width / 4, height / 2 + 5);
  };

  if (loading) {
    return (
      <div className="bg-[#1A1A1A] rounded-lg p-6 text-center">
        <p className="text-white">Loading match data...</p>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="bg-[#1A1A1A] rounded-lg p-6 text-center">
        <p className="text-gray-400">No live data available</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1A1A1A] rounded-lg p-6 space-y-6">
      {/* Match Header */}
      <div className="text-center">
        <div className="flex items-center justify-center space-x-4 mb-4">
          <div className="text-right flex-1">
            <p className="text-xl font-bold text-white">{homeTeam}</p>
          </div>
          <div className="text-4xl font-bold text-[#FFD700]">
            {match.homeScore} - {match.awayScore}
          </div>
          <div className="text-left flex-1">
            <p className="text-xl font-bold text-white">{awayTeam}</p>
          </div>
        </div>
        <div className="flex items-center justify-center space-x-4">
          <span className={`px-3 py-1 rounded text-sm ${
            match.status === 'LIVE' ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-700 text-gray-300'
          }`}>
            {match.status === 'LIVE' ? `LIVE ${match.matchTime}'` : match.status}
          </span>
        </div>
      </div>

      {/* Possession Canvas */}
      <div>
        <h3 className="text-lg font-bold text-white mb-2">Ball Possession</h3>
        <canvas
          ref={canvasRef}
          width={600}
          height={50}
          className="w-full rounded"
        />
      </div>

      {/* Match Statistics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-white">{match.homeShots}</p>
          <p className="text-sm text-gray-400">Shots (Home)</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-white">{match.homeCorners}</p>
          <p className="text-sm text-gray-400">Corners (Home)</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-white">{match.awayShots}</p>
          <p className="text-sm text-gray-400">Shots (Away)</p>
        </div>
      </div>

      {/* Match Events */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4">Match Events</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {match.events
            .sort((a, b) => b.minute - a.minute)
            .map((event, index) => (
              <div
                key={index}
                className={`flex items-center space-x-3 p-3 rounded ${
                  event.team === 'HOME' ? 'bg-blue-900/20' : 'bg-green-900/20'
                }`}
              >
                <span className="text-2xl">
                  {event.type === 'GOAL' ? '⚽' : event.type === 'CARD' ? '🟥' : '🔄'}
                </span>
                <div className="flex-1">
                  <p className="text-white font-semibold">{event.player}</p>
                  <p className="text-sm text-gray-400">
                    {event.type} • {event.minute}'
                    {event.detail && ` • ${event.detail}`}
                  </p>
                </div>
                <span className="text-sm text-gray-400">
                  {event.team === 'HOME' ? homeTeam : awayTeam}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default LiveMatchTracker;
