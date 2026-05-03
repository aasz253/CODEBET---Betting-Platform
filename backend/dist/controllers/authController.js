"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPhone = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const ageVerification_1 = require("../services/ageVerification");
const prisma = new client_1.PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const register = async (req, res) => {
    try {
        const { phoneNumber, password, fullName, idNumber, dateOfBirth, confirmAge, referralCode } = req.body;
        if (!phoneNumber || !password || !fullName || !idNumber || !dateOfBirth) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        const existingUser = await prisma.user.findUnique({
            where: { phoneNumber }
        });
        if (existingUser) {
            return res.status(409).json({ error: 'Phone number already registered' });
        }
        let isAgeVerified = false;
        if (confirmAge === true) {
            isAgeVerified = (0, ageVerification_1.confirmAgeManual)(dateOfBirth);
            if (!isAgeVerified) {
                return res.status(403).json({ error: 'You must be 18 years or older to register' });
            }
        }
        else {
            isAgeVerified = await (0, ageVerification_1.verifyAgeByPhone)(phoneNumber);
            if (!isAgeVerified) {
                return res.status(403).json({ error: 'Age verification failed. You must be 18 years or older to register' });
            }
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                phoneNumber,
                password: hashedPassword,
                fullName,
                idNumber,
                dateOfBirth: new Date(dateOfBirth),
                isAgeVerified,
            },
            select: {
                id: true,
                phoneNumber: true,
                fullName: true,
                isAgeVerified: true,
                role: true,
            },
        });
        await prisma.wallet.create({
            data: {
                userId: user.id,
                balance: 0,
            },
        });
        const token = jsonwebtoken_1.default.sign({ userId: user.id, phoneNumber: user.phoneNumber, role: user.role, isAgeVerified: user.isAgeVerified }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        if (referralCode) {
            console.log(`Referral code ${referralCode} used by user ${user.id}`);
        }
        return res.status(201).json({
            message: 'Registration successful',
            user: {
                id: user.id,
                phoneNumber: user.phoneNumber,
                fullName: user.fullName,
                isVerified: false,
                isAgeVerified: user.isAgeVerified,
                role: user.role,
            },
            token,
        });
    }
    catch (error) {
        console.error('Register error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { phoneNumber, password } = req.body;
        if (!phoneNumber || !password) {
            return res.status(400).json({ error: 'Phone number and password are required' });
        }
        const user = await prisma.user.findUnique({
            where: { phoneNumber }
        });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, phoneNumber: user.phoneNumber, role: user.role, isAgeVerified: user.isAgeVerified }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        return res.status(200).json({
            message: 'Login successful',
            user: {
                id: user.id,
                phoneNumber: user.phoneNumber,
                fullName: user.fullName,
                isVerified: user.isAgeVerified,
                isAgeVerified: user.isAgeVerified,
                role: user.role
            },
            token
        });
    }
    catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.login = login;
const verifyPhone = async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        if (!phoneNumber) {
            return res.status(400).json({ error: 'Phone number is required' });
        }
        const user = await prisma.user.findUnique({
            where: { phoneNumber }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        console.log(`OTP for ${phoneNumber}: ${otp}`);
        return res.status(200).json({
            message: 'OTP sent successfully',
            otp
        });
    }
    catch (error) {
        console.error('Verify phone error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.verifyPhone = verifyPhone;
