"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedisClient = exports.publishOddsUpdate = exports.initializeOddsWebSocket = void 0;
const socket_io_1 = require("socket.io");
const ioredis_1 = __importDefault(require("ioredis"));
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const redisSubscriber = new ioredis_1.default(REDIS_URL);
const redisPublisher = new ioredis_1.default(REDIS_URL);
const initializeOddsWebSocket = (httpServer) => {
    const io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    });
    redisSubscriber.subscribe('odds-updates', (err, count) => {
        if (err) {
            console.error('Failed to subscribe to odds-updates:', err);
        }
        else {
            console.log(`Subscribed to odds-updates channel. Subscription count: ${count}`);
        }
    });
    redisSubscriber.on('message', (channel, message) => {
        if (channel === 'odds-updates') {
            try {
                const oddsData = JSON.parse(message);
                io.emit('odds-update', oddsData);
                console.log('Broadcasted odds update:', oddsData);
            }
            catch (error) {
                console.error('Error parsing odds update message:', error);
            }
        }
    });
    io.on('connection', (socket) => {
        console.log(`Client connected: ${socket.id}`);
        socket.on('subscribe-odds', (eventId) => {
            socket.join(`event-${eventId}`);
            console.log(`Client ${socket.id} subscribed to event ${eventId}`);
        });
        socket.on('unsubscribe-odds', (eventId) => {
            socket.leave(`event-${eventId}`);
            console.log(`Client ${socket.id} unsubscribed from event ${eventId}`);
        });
        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`);
        });
    });
    return io;
};
exports.initializeOddsWebSocket = initializeOddsWebSocket;
const publishOddsUpdate = async (eventId, marketId, oddsData) => {
    const message = JSON.stringify({
        eventId,
        marketId,
        odds: oddsData,
        timestamp: new Date().toISOString()
    });
    await redisPublisher.publish('odds-updates', message);
};
exports.publishOddsUpdate = publishOddsUpdate;
const getRedisClient = () => redisPublisher;
exports.getRedisClient = getRedisClient;
