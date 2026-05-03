"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeAviatorWebSocket = void 0;
const socket_io_1 = require("socket.io");
const ioredis_1 = __importDefault(require("ioredis"));
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const redisSubscriber = new ioredis_1.default(REDIS_URL);
const redisPublisher = new ioredis_1.default(REDIS_URL);
let currentGame = null;
let gameInterval;
const initializeAviatorWebSocket = (httpServer) => {
    const io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    });
    redisSubscriber.subscribe('aviator-game-events', (err, count) => {
        if (err) {
            console.error('Failed to subscribe to aviator-game-events:', err);
        }
        else {
            console.log(`Subscribed to aviator-game-events. Subscription count: ${count}`);
        }
    });
    redisSubscriber.on('message', (channel, message) => {
        if (channel === 'aviator-game-events') {
            try {
                const event = JSON.parse(message);
                io.emit(event.type, event.data);
            }
            catch (error) {
                console.error('Error parsing aviator game event:', error);
            }
        }
    });
    const generateCrashPoint = () => {
        const random = Math.random();
        const maxCrash = 1000;
        const crashPoint = Math.floor(Math.exp(random * Math.log(maxCrash)) * 100) / 100;
        return Math.max(1.00, crashPoint);
    };
    const startNewGame = () => {
        const crashPoint = generateCrashPoint();
        const startTime = Date.now();
        currentGame = {
            currentMultiplier: 1.00,
            crashPoint,
            startTime,
            isRunning: true
        };
        publishGameEvent('game-started', {
            crashPoint,
            startTime: new Date(startTime).toISOString()
        });
        const duration = 15000 + (crashPoint - 1) * 100;
        gameInterval = setInterval(() => {
            if (!currentGame)
                return;
            const elapsed = Date.now() - currentGame.startTime;
            const progress = Math.min(elapsed / duration, 1);
            const currentMultiplier = 1 + (crashPoint - 1) * progress;
            if (currentMultiplier >= crashPoint || progress >= 1) {
                endGame();
                return;
            }
            currentGame.currentMultiplier = parseFloat(currentMultiplier.toFixed(2));
            publishGameEvent('multiplier-update', {
                multiplier: currentGame.currentMultiplier
            });
        }, 100);
    };
    const endGame = () => {
        if (gameInterval) {
            clearInterval(gameInterval);
            gameInterval = null;
        }
        if (currentGame) {
            publishGameEvent('game-crashed', {
                crashPoint: currentGame.crashPoint
            });
            currentGame.isRunning = false;
        }
        const nextGameDelay = 15000 + Math.floor(Math.random() * 15000);
        const nextCrashPoint = generateCrashPoint();
        publishGameEvent('next-game', {
            crashPoint: nextCrashPoint
        });
        setTimeout(startNewGame, nextGameDelay);
    };
    const publishGameEvent = (type, data) => {
        redisPublisher.publish('aviator-game-events', JSON.stringify({ type, data }));
    };
    startNewGame();
    io.on('connection', (socket) => {
        console.log(`Client connected to Aviator: ${socket.id}`);
        socket.on('subscribe-aviator', () => {
            if (currentGame && currentGame.isRunning) {
                socket.emit('game-started', {
                    crashPoint: currentGame.crashPoint,
                    startTime: new Date(currentGame.startTime).toISOString()
                });
                socket.emit('multiplier-update', {
                    multiplier: currentGame.currentMultiplier
                });
            }
        });
        socket.on('place-bet', (data) => {
            if (!currentGame || !currentGame.isRunning) {
                socket.emit('bet-eror', { error: 'No active game' });
                return;
            }
            console.log(`Player placed bet: ${data.amount}`);
        });
        socket.on('cash-out', () => {
            if (!currentGame || !currentGame.isRunning)
                return;
            console.log(`Player cashed out at ${currentGame.currentMultiplier}x`);
            socket.emit('player-cashed-out', {
                multiplier: currentGame.currentMultiplier,
                profit: 0
            });
        });
        socket.on('disconnect', () => {
            console.log(`Client disconnected from Aviator: ${socket.id}`);
        });
    });
    return io;
};
exports.initializeAviatorWebSocket = initializeAviatorWebSocket;
