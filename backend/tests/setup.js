"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
beforeAll(async () => {
    process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://codebet:password@localhost:5433/codebet_test';
    await prisma.$connect();
});
afterAll(async () => {
    await prisma.$disconnect();
});
beforeEach(async () => {
    // Clean up database before each test
    await prisma.transaction.deleteMany();
    await prisma.wallet.deleteMany();
    await prisma.user.deleteMany();
});
