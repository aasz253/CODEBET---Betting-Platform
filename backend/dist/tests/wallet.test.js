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
describe('Wallet API', () => {
    let authToken;
    let userId;
    beforeEach(async () => {
        await prisma.transaction.deleteMany();
        await prisma.wallet.deleteMany();
        await prisma.user.deleteMany();
        const registerResponse = await (0, supertest_1.default)(index_1.default)
            .post('/api/auth/register')
            .send({
            phoneNumber: '+254712345684',
            password: 'Password123!',
            fullName: 'Wallet Test',
            idNumber: '12345684',
            dateOfBirth: '1990-01-01',
        });
        authToken = registerResponse.body.token;
        userId = registerResponse.body.user.id;
        await prisma.user.update({
            where: { id: userId },
            data: { isAgeVerified: true },
        });
    });
    afterAll(async () => {
        await prisma.$disconnect();
    });
    describe('POST /api/wallet/deposit', () => {
        it('should deposit money and update balance', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/wallet/deposit')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ amount: 1000 });
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Deposit successful');
            expect(response.body.balance).toBe(1000);
        });
        it('should reject deposit below minimum (1 KES)', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/wallet/deposit')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ amount: 0.5 });
            expect(response.status).toBe(400);
        });
        it('should create transaction record on deposit', async () => {
            await (0, supertest_1.default)(index_1.default)
                .post('/api/wallet/deposit')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ amount: 1000 });
            const transactions = await prisma.transaction.findMany({
                where: { userId },
            });
            expect(transactions.length).toBe(1);
            expect(transactions[0].type).toBe('DEPOSIT');
            expect(Number(transactions[0].amount)).toBe(1000);
        });
    });
    describe('POST /api/wallet/withdraw', () => {
        beforeEach(async () => {
            await (0, supertest_1.default)(index_1.default)
                .post('/api/wallet/deposit')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ amount: 1000 });
        });
        it('should withdraw money with sufficient balance', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/wallet/withdraw')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ amount: 500 });
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Withdrawal successful');
            expect(response.body.balance).toBe(500);
        });
        it('should block withdrawal with insufficient funds', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/wallet/withdraw')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ amount: 2000 });
            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Insufficient balance');
        });
        it('should reject withdrawal below minimum (100 KES)', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/wallet/withdraw')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ amount: 50 });
            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Minimum withdrawal is 100 KES');
        });
    });
    describe('GET /api/wallet/balance', () => {
        it('should return correct balance', async () => {
            await (0, supertest_1.default)(index_1.default)
                .post('/api/wallet/deposit')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ amount: 500 });
            const response = await (0, supertest_1.default)(index_1.default)
                .get('/api/wallet/balance')
                .set('Authorization', `Bearer ${authToken}`);
            expect(response.status).toBe(200);
            expect(response.body.balance).toBe(500);
        });
    });
    describe('GET /api/wallet/transactions', () => {
        it('should return transaction history', async () => {
            await (0, supertest_1.default)(index_1.default)
                .post('/api/wallet/deposit')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ amount: 1000 });
            const response = await (0, supertest_1.default)(index_1.default)
                .get('/api/wallet/transactions')
                .set('Authorization', `Bearer ${authToken}`);
            expect(response.status).toBe(200);
            expect(response.body.transactions.length).toBeGreaterThan(0);
            expect(response.body.pagination).toBeDefined();
        });
    });
    describe('Transaction rollback on error', () => {
        it('should rollback deposit on error', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/wallet/deposit')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ amount: -100 });
            expect(response.status).toBe(400);
            const wallet = await prisma.wallet.findUnique({
                where: { userId },
            });
            expect(Number(wallet?.balance)).toBe(0);
        });
    });
});
