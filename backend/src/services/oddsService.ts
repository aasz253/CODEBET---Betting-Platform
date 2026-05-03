import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const redisSubscriber = new Redis(REDIS_URL);
const redisPublisher = new Redis(REDIS_URL);

export const initializeOddsWebSocket = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  redisSubscriber.subscribe('odds-updates', (err, count) => {
    if (err) {
      console.error('Failed to subscribe to odds-updates:', err);
    } else {
      console.log(`Subscribed to odds-updates channel. Subscription count: ${count}`);
    }
  });

  redisSubscriber.on('message', (channel, message) => {
    if (channel === 'odds-updates') {
      try {
        const oddsData = JSON.parse(message);
        io.emit('odds-update', oddsData);
        console.log('Broadcasted odds update:', oddsData);
      } catch (error) {
        console.error('Error parsing odds update message:', error);
      }
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('subscribe-odds', (eventId: string) => {
      socket.join(`event-${eventId}`);
      console.log(`Client ${socket.id} subscribed to event ${eventId}`);
    });

    socket.on('unsubscribe-odds', (eventId: string) => {
      socket.leave(`event-${eventId}`);
      console.log(`Client ${socket.id} unsubscribed from event ${eventId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const publishOddsUpdate = async (eventId: string, marketId: string, oddsData: any) => {
  const message = JSON.stringify({
    eventId,
    marketId,
    odds: oddsData,
    timestamp: new Date().toISOString()
  });

  await redisPublisher.publish('odds-updates', message);
};

export const getRedisClient = () => redisPublisher;
