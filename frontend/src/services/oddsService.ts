import axios from 'axios';
import { Event } from '../types/event';

export const getEvents = async (): Promise<{ live: Event[]; preMatch: Event[] }> => {
  const response = await axios.get('/api/events');
  return response.data;
};

export const getEventMarkets = async (eventId: string): Promise<Event> => {
  const response = await axios.get(`/api/events/${eventId}/markets`);
  return response.data;
};

export const getLiveOdds = async (eventId: string): Promise<any> => {
  const response = await axios.get(`/api/odds/live/${eventId}`);
  return response.data;
};

type OddsChangeListener = (update: {
  eventId: string;
  marketId: string;
  newValue: number;
  oldValue?: number;
}) => void;

const listeners = new Set<OddsChangeListener>();

export const listenToOddsChanges = (callback: OddsChangeListener) => {
  listeners.add(callback);
  
  return () => {
    listeners.delete(callback);
  };
};

export const notifyOddsChange = (eventId: string, marketId: string, newValue: number, oldValue?: number) => {
  listeners.forEach((listener) => {
    listener({ eventId, marketId, newValue, oldValue });
  });
};
