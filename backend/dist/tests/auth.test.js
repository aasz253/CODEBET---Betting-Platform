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
describe('Auth API', () => {
    beforeEach(async () => {
        await prisma.transaction.deleteMany();
        await prisma.wallet.deleteMany();
        await prisma.user.deleteMany();
    });
    afterAll(async () => {
        await prisma.$disconnect();
    });
    describe('POST /api/auth/register', () => {
        it('should register a new user with valid data', async () => {
            const userData = {
                phoneNumber: '+254712345678',
                password: 'Password123!',
                fullName: 'John Doe',
                idNumber: '12345678',
                dateOfBirth: '1990-01-01',
            };
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/auth/register')
                .send(userData);
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('token');
            expect(response.body.user.phoneNumber).toBe(userData.phoneNumber);
            expect(response.body.user.fullName).toBe(userData.fullName);
            expect(response.body.user.isAgeVerified).toBe(false);
        });
        it('should reject registration for under 18', async () => {
            const userData = {
                phoneNumber: '+254712345679',
                password: 'Password123!',
                fullName: 'Young User',
                idNumber: '12345679',
                dateOfBirth: '2010-01-01', // Under 18
            };
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/auth/register')
                .send(userData);
            expect(response.status).toBe(400);
            expect(response.body.error).toBe('You must be at least 18 years old');
        });
        it('should reject duplicate phone number', async () => {
            const userData = {
                phoneNumber: '+254712345680',
                password: 'Password123!',
                fullName: 'Duplicate User',
                idNumber: '12345680',
                dateOfBirth: '1990-01-01',
            };
            await (0, supertest_1.default)(index_1.default)
                .post('/api/auth/register')
                .send(userData);
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/auth/register')
                .send(userData);
            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Phone number already registered');
        });
        it('should require age verification for registration', async () => {
            const userData = {
                phoneNumber: '+254712345681',
                password: 'Password123!',
                fullName: 'Test User',
                idNumber: '12345681',
                dateOfBirth: '1990-01-01',
            };
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/auth/register')
                .send(userData);
            expect(response.status).toBe(201);
            expect(response.body.user.isAgeVerified).toBe(false);
        });
    });
    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            await (0, supertest_1.default)(index_1.default)
                .post('/api/auth/register')
                .send({
                phoneNumber: '+254712345682',
                password: 'Password123!',
                fullName: 'Login Test',
                idNumber: '12345682',
                dateOfBirth: '1990-01-01',
            });
        });
        it('should login with valid credentials', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/auth/login')
                .send({
                phoneNumber: '+254712345682',
                password: 'Password123!',
            });
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('token');
            expect(response.body.user.phoneNumber).toBe('+254712345682');
        });
        it('should reject invalid password', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/auth/login')
                .send({
                phoneNumber: '+254712345682',
                password: 'WrongPassword',
            });
            expect(response.status).toBe(401);
            expect(response.body.error).toBe('Invalid credentials');
        });
        it('should reject non-existent user', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/auth/login')
                .send({
                phoneNumber: '+254799999999',
                password: 'Password123!',
            });
            expect(response.status).toBe(401);
            expect(response.body.error).toBe('Invalid credentials');
        });
    });
    describe('GET /api/auth/verify-phone', () => {
        it('should verify phone with correct OTP', async () => {
            const registerResponse = await (0, supertest_1.default)(index_1.default)
                .post('/api/auth/register')
                .send({
                phoneNumber: '+254712345683',
                password: 'Password123!',
                fullName: 'Verify Test',
                idNumber: '12345683',
                dateOfBirth: '1990-01-01',
            });
            const token = registerResponse.body.token;
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/auth/verify-phone')
                .set('Authorization', `Bearer ${token}`)
                .send({ otp: '123456' });
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Phone verified successfully');
        });
    });
});
