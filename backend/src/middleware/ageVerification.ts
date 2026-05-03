import { Request, Response, NextFunction } from 'express';

export const requireAgeVerified = async (req: Request, res: Response, next: NextFunction) => {
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
  } catch (error) {
    console.error('Age verification middleware error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
