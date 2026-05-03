import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const checkResponsibleGaming = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) return next();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { selfExclusion: true },
    });

    if (!user) return next();

    const activeExclusion = user.selfExclusion?.excludedUntil && user.selfExclusion.excludedUntil > new Date() || user.selfExclusion?.isPermanent;

    if (activeExclusion) {
      return res.status(403).json({ error: 'You are excluded from betting' });
    }

    next();
  } catch (error) {
    next();
  }
};

export const checkDailyLimit = async (req: Request, res: Response, next: NextFunction) => {
  next();
};

export const checkMonthlyLimit = async (req: Request, res: Response, next: NextFunction) => {
  next();
};
