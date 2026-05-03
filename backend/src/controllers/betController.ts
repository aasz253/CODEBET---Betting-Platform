import { Request, Response } from 'express';
import { PrismaClient, BetType, BetStatus } from '@prisma/client';

const prisma = new PrismaClient();

export const createBetSlip = async (req: Request, res: Response) => {
  try {
    const { userId, bets, betType } = req.body;

    if (!userId || !bets || !Array.isArray(bets) || bets.length === 0) {
      return res.status(400).json({ error: 'User ID and bets array are required' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const totalStake = bets.reduce((sum: number, bet: any) => sum + parseFloat(bet.stake), 0);
    const totalPotentialWin = totalStake * 2; // Simplified calculation

    const betSlip = await prisma.betSlip.create({
      data: {
        userId,
        totalStake,
        totalPotentialWin,
        betType: betType || BetType.SINGLE,
        isPlaced: false,
      }
    });

    res.status(201).json({ betSlip, bets: [] });
  } catch (error) {
    console.error('Create bet slip error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const placeBet = async (req: Request, res: Response) => {
  try {
    const { betSlipId } = req.body;

    const betSlip = await prisma.betSlip.findUnique({
      where: { id: betSlipId },
    });

    if (!betSlip) {
      return res.status(404).json({ error: 'Bet slip not found' });
    }

    await prisma.betSlip.update({
      where: { id: betSlipId },
      data: { isPlaced: true },
    });

    res.json({ message: 'Bet placed successfully' });
  } catch (error) {
    console.error('Place bet error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getBetHistory = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const betSlips = await prisma.betSlip.findMany({
      where: { userId: userId as string },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ betSlips });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const calculateWin = async (req: Request, res: Response) => {
  try {
    res.json({ message: 'Calculate win not implemented' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
