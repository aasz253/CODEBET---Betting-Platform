import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const logs = await prisma.auditLog.findMany({
      take: 100,
      orderBy: { timestamp: 'desc' },
    });
    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
};

export const getDailySummary = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const bets = await prisma.bet.findMany({
      where: { createdAt: { gte: today } },
    });
    
    const totalStakes = bets.reduce((sum, bet) => sum + Number(bet.stake), 0);
    const houseProfit = totalStakes * 0.05;
    
    res.json({ totalBets: bets.length, totalStakes, houseProfit });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
};

export const getResponsibleGamingReport = async (req: Request, res: Response) => {
  try {
    const selfExcludedUsers = await prisma.selfExclusion.findMany({
      where: {
        OR: [
          { excludedUntil: { gt: new Date() } },
          { isPermanent: true },
        ],
      },
    });

    res.json({ selfExcludedUsers: selfExcludedUsers.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
};

export const exportAuditLog = async (req: Request, res: Response) => {
  res.json({ message: 'Export not implemented' });
};

export const sendComplianceReport = async (req: Request, res: Response) => {
  res.json({ message: 'Send report not implemented' });
};
