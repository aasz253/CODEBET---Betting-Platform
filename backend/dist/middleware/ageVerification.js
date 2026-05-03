"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAgeVerified = void 0;
const requireAgeVerified = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        if (!req.user?.isAgeVerified) {
            return res.status(403).json({
                error: 'Age verification required',
                message: 'You must be age verified to place bets. Please complete age verification during registration.'
            });
        }
        next();
    }
    catch (error) {
        console.error('Age verification middleware error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.requireAgeVerified = requireAgeVerified;
