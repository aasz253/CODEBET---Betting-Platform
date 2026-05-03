"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirmAgeManual = exports.verifyAgeByPhone = void 0;
const axios_1 = __importDefault(require("axios"));
const verifyAgeByPhone = async (phoneNumber) => {
    try {
        const apiKey = process.env.AGE_VERIFICATION_API_KEY;
        const apiUrl = process.env.AGE_VERIFICATION_API_URL || 'https://api.pepea.co.ke/verify-age';
        if (!apiKey) {
            console.warn('AGE_VERIFICATION_API_KEY not set, using mock verification for development');
            return mockAgeVerification(phoneNumber);
        }
        const response = await axios_1.default.post(apiUrl, {
            phoneNumber,
            service: 'age-verification'
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });
        if (response.data && response.data.success) {
            return response.data.isOver18 === true;
        }
        console.error('Age verification API error:', response.data?.message);
        return false;
    }
    catch (error) {
        console.error('Age verification service error:', error.message);
        return false;
    }
};
exports.verifyAgeByPhone = verifyAgeByPhone;
const confirmAgeManual = (dateOfBirth) => {
    const dob = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (age > 18 || (age === 18 && monthDiff > 0) || (age === 18 && monthDiff === 0 && today.getDate() >= dob.getDate())) {
        return true;
    }
    return false;
};
exports.confirmAgeManual = confirmAgeManual;
const mockAgeVerification = (phoneNumber) => {
    console.log(`[MOCK] Verifying age for phone: ${phoneNumber}`);
    const lastTwoDigits = parseInt(phoneNumber.slice(-2));
    return lastTwoDigits % 2 === 0;
};
