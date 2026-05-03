"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const supertest_1 = __importDefault(require("supertest"));
const client_1 = require("@prisma/client");
const index_1 = __importDefault(require("../src/index"));
const prisma = new client_1.PrismaClient();
describe('Betting API', () => {
    let authToken;
    let userId;
    let eventId;
    let marketId;
    let oddsId;
    beforeEach(async () => {
        await prisma.transaction.deleteMany();
        await prisma.wallet.deleteMany();
        await prisma.bet.deleteMany();
        await prisma.betSlip.deleteMany();
        await prisma.market.deleteMany();
        await prisma.event.deleteMany();
        await prisma.user.deleteMany();
        const registerResponse = await (0, supertest_1.default)(index_1.default)
            .post('/api/auth/register')
            .send({
            phoneNumber: '+254712345685',
            password: 'Password123!',
            fullName: 'Betting Test',
            idNumber: '12345685',
            dateOfBirth: '1990-01-01',
        });
        authToken = registerResponse.body.token;
        userId = registerResponse.body.user.id;
        await prisma.user.update({
            where: { id: userId },
            data: { isAgeVerified: true },
        });
        await (0, supertest_1.default)(index_1.default)
            .post('/api/wallet/deposit')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ amount: 10000 });
        const event = await prisma.event.create({
            data: {
                sport: 'Football',
                league: 'Premier League',
                homeTeam: 'Arsenal',
                awayTeam: 'Chelsea',
                startTime: new Date(Date.now() + 3600000),
                status: 'PENDING',
            },
        });
        eventId = event.id;
        const market = await prisma.market.create({
            data: {
                eventId: event.id,
                type: 'ONE_X_TWO',
                name: 'Match Result',
            },
        });
        marketId = market.id;
        const odds = await prisma.odds.create({
            data: {
                marketId: market.id,
                value: 2.5,
                current: true,
                isActive: true,
            },
        });
        oddsId = odds.id;
    });
    afterAll(async () => {
        await prisma.$disconnect();
    });
    describe('POST /api/bets/slip', () => {
        it('should create bet slip with valid data', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/bets/slip')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                bets: [
                    {
                        eventId,
                        marketId,
                        oddsId,
                        stake: 100,
                    },
                ],
            });
            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Bet placed successfully');
            expect(response.body.betSlip.totalStake).toBe(100);
        });
        it('should reject bet with insufficient balance', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/bets/slip')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                bets: [
                    {
                        eventId,
                        marketId,
                        oddsId,
                        stake: 20000,
                    },
                ],
            });
            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Insufficient balance for total stake');
        });
        it('should calculate potential win correctly for single bet', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/bets/slip')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                bets: [
                    {
                        eventId,
                        marketId,
                        oddsId,
                        stake: 100,
                    },
                ],
            });
            expect(response.status).toBe(201);
            expect(response.body.betSlip.totalPotentialWin).toBe(250);
        });
        it('should calculate potential win correctly for multiple bets', async () => {
            const event2 = await prisma.event.create({
                data: {
                    sport: 'Basketball',
                    league: 'NBA',
                    homeTeam: 'Lakers',
                    awayTeam: 'Warriors',
                    startTime: new Date(Date.now() + 7200000),
                    status: 'PENDING',
                },
            });
            const market2 = await prisma.market.create({
                data: {
                    eventId: event2.id,
                    type: 'ONE_X_TWO',
                    name: 'Match Result',
                },
            });
            await prisma.odds.create({
                data: {
                    marketId: market2.id,
                    value: 1.8,
                    current: true,
                    isActive: true,
                },
            });
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/bets/slip')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                bets: [
                    {
                        eventId,
                        marketId,
                        oddsId,
                        stake: 100,
                    },
                    {
                        eventId: event2.id,
                        marketId: market2.id,
                        oddsId: (await prisma.odds.findFirst({ where: { marketId: market2.id } })).id,
                        stake: 100,
                    },
                ],
            });
            expect(response.status).toBe(201);
            expect(response.body.betSlip.totalPotentialWin).toBeCloseTo(450, 0);
        });
    });
    describe('GET /api/bets/history', () => {
        it('should return bet history', async () => {
            await (0, supertest_1.default)(index_1.default)
                .post('/api/bets/slip')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                bets: [
                    {
                        eventId,
                        marketId,
                        oddsId,
                        stake: 100,
                    },
                ],
            });
            const response = await (0, supertest_1.default)(index_1.default)
                .get('/api/bets/history')
                .set('Authorization', `Bearer ${authToken}`);
            expect(response.status).toBe(200);
            expect(response.body.bets.length).toBeGreaterThan(0);
        });
    });
    describe('Stake deduction', () => {
        it('should deduct stake from wallet on bet placement', async () => {
            await (0, supertest_1.default)(index_1.default)
                .post('/api/bets/slip')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                bets: [
                    {
                        eventId,
                        marketId,
                        oddsId,
                        stake: 500,
                    },
                ],
            });
            const wallet = await prisma.wallet.findUnique({
                where: { userId },
            });
            expect(Number(wallet?.balance)).toBe(9500);
        });
    });
});
