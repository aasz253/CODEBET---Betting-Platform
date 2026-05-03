import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useBetslipStore } from '../store/betslipStore';

interface OddsUpdate {
  eventId: string;
  marketId: string;
  odds: {
    marketId: string;
    oddsId: string;
    value: number;
    isActive: boolean;
    previousValue?: number;
  };
  timestamp: string;
}

export const useWebSocket = (url: string = 'http://localhost:5000') => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [oddsUpdates, setOddsUpdates] = useState<OddsUpdate[]>([]);
  const updateBetSlipOdds = useBetslipStore((state) => state.updateOddsValue);

  useEffect(() => {
    const socket = io(url, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    socket.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    socket.on('odds-update', (data: OddsUpdate) => {
      console.log('Odds update received:', data);
      setOddsUpdates((prev) => [...prev.slice(-9), data]);

      updateBetSlipOdds(data.marketId, data.odds.value);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [url, updateBetSlipOdds]);

  const subscribeToEvent = useCallback((eventId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('subscribe-odds', eventId);
    }
  }, []);

  const unsubscribeFromEvent = useCallback((eventId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('unsubscribe-odds', eventId);
    }
  }, []);

  return {
    isConnected,
    oddsUpdates,
    subscribeToEvent,
    unsubscribeFromEvent,
  };
};
