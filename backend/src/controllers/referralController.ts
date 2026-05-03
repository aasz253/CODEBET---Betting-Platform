import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export const generateReferralCode = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.referralCode || user.referralCode === '') {
      const newCode = crypto.randomBytes(4).toString('hex').toUpperCase();
      
      const updated = await prisma.user.update({
        where: { id: userId },
        data: { referralCode: newCode },
        select: { referralCode: true },
      });

      return res.json({ referralCode: updated.referralCode });
    }

    res.json({ referralCode: user.referralCode });
  } catch (error) {
    console.error('Generate referral code error:', error);
    res.status(500).json({ error: 'Failed to generate referral code' });
  }
};

export const trackReferral = async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    const { userId } = req.body;

    if (!code || !userId) {
      return res.status(400).json({ error: 'Missing code or userId' });
    }

    const referrer = await prisma.user.findFirst({
      where: { referralCode: code },
    });

    if (!referrer) {
      return res.status(404).json({ error: 'Invalid referral code' });
    }

    if (referrer.id === userId) {
      return res.status(400).json({ error: 'Cannot refer yourself' });
    }

    const existingReferral = await prisma.referral.findUnique({
      where: { referredUserId: userId },
    });

    if (existingReferral) {
      return res.status(400).json({ error: 'User already referred' });
    }

    const referral = await prisma.referral.create({
      data: {
        referrerId: referrer.id,
        referredUserId: userId,
        status: 'PENDING',
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { referredBy: referrer.id },
    });

    res.json({ message: 'Referral tracked successfully', referral });
  } catch (error) {
    console.error('Track referral error:', error);
    res.status(500).json({ error: 'Failed to track referral' });
  }
};

export const creditReferralBonus = async (referredUserId: string) => {
  try {
    const referral = await prisma.referral.findUnique({
      where: { referredUserId },
      include: { referrer: true },
    });

    if (!referral || referral.status !== 'PENDING') {
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.referral.update({
        where: { id: referral.id },
        data: { status: 'CREDITED' },
      });

      await tx.bonus.create({
        data: {
          userId: referral.referrerId,
          type: 'REFERRAL',
          amount: 5000,
          wageringRequirement: 15000,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      await tx.wallet.upsert({
        where: { userId: referral.referrerId },
        update: { balance: { increment: 5000 } },
        create: {
          userId: referral.referrerId,
          balance: 5000,
        },
      });

      await tx.transaction.create({
        data: {
          userId: referral.referrerId,
          type: 'WIN',
          amount: 5000,
          status: 'COMPLETED',
          reference: `REF-${Date.now()}`,
        },
      });
    });

    console.log(`Credited referral bonus to user ${referral.referrerId}`);
  } catch (error) {
    console.error('Credit referral bonus error:', error);
  }
};

export const getReferralStats = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const referrals = await prisma.referral.findMany({
      where: { referrerId: userId },
      include: {
        referredUser: {
          select: { fullName: true, createdAt: true },
        },
      },
    });

    const totalReferrals = referrals.length;
    const creditedReferrals = referrals.filter(r => r.status === 'CREDITED').length;
    const totalBonus = await prisma.bonus.aggregate({
      where: {
        userId,
        type: 'REFERRAL',
      },
      _sum: { amount: true },
    });

    const pendingBonus = await prisma.referral.count({
      where: {
        referrerId: userId,
        status: 'PENDING',
      },
    });

    res.json({
      totalReferrals,
      creditedReferrals,
      pendingReferrals: pendingBonus,
      totalBonusEarned: Number(totalBonus._sum.amount || 0),
      referrals: referrals.map(r => ({
        name: r.referredUser.fullName,
        date: r.referredUser.createdAt,
        status: r.status,
        bonus: Number(r.bonusAmount),
      })),
    });
  } catch (error) {
    console.error('Get referral stats error:', error);
    res.status(500).json({ error: 'Failed to get referral stats' });
  }
};

export const getAvailableBonuses = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const bonuses = await prisma.bonus.findMany({
      where: {
        userId,
        isUsed: false,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    });

    const now = new Date();
    const available = bonuses.filter(b => {
      if (b.expiresAt && b.expiresAt < now) return false;
      return Number(b.wageredAmount) < Number(b.wageringRequirement);
    });

    res.json({
      bonuses: available.map(b => ({
        id: b.id,
        type: b.type,
        amount: Number(b.amount),
        wageringRequirement: Number(b.wageringRequirement),
        wageredAmount: Number(b.wageredAmount),
        remainingWager: Number(b.wageringRequirement) - Number(b.wageredAmount),
        expiresAt: b.expiresAt,
      })),
    });
  } catch (error) {
    console.error('Get bonuses error:', error);
    res.status(500).json({ error: 'Failed to get bonuses' });
  }
};

export const checkWelcomeBonus = async (userId: string, depositAmount: number) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { bonuses: true },
    });

    if (!user) return;

    const hasWelcomeBonus = user.bonuses.some(b => b.type === 'WELCOME');
    if (hasWelcomeBonus) return;

    if (depositAmount >= 100) {
      await prisma.bonus.create({
        data: {
          userId,
          type: 'WELCOME',
          amount: 100,
          wageringRequirement: 300,
        },
      });

      await prisma.wallet.update({
        where: { userId },
        data: { balance: { increment: 100 } },
      });

      console.log(`Welcome bonus credited to user ${userId}`);
    }
  } catch (error) {
    console.error('Check welcome bonus error:', error);
  }
};

export const checkDepositBonus = async (userId: string, depositAmount: number) => {
  try {
    const now = new Date();
    const dayOfWeek = now.getDay();
    
    if (dayOfWeek !== 5) return;

    const bonusAmount = Math.min(depositAmount * 0.5, 5000);

    await prisma.bonus.create({
      data: {
        userId,
        type: 'DEPOSIT',
        amount: bonusAmount,
        wageringRequirement: bonusAmount * 3,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.wallet.update({
      where: { userId },
      data: { balance: { increment: bonusAmount } },
    });

    console.log(`Deposit bonus of ${bonusAmount} credited to user ${userId}`);
  } catch (error) {
    console.error('Check deposit bonus error:', error);
  }
};

export const updateWagerAmount = async (userId: string, amount: number) => {
  try {
    await prisma.bonus.updateMany({
      where: {
        userId,
        isUsed: false,
        isActive: true,
      },
      data: {
        wageredAmount: { increment: amount },
      },
    });

    await prisma.bonus.updateMany({
      where: {
        userId,
        wageredAmount: { gte: prisma.bonus.fields.wageringRequirement },
      },
      data: {
        isUsed: true,
      },
    });
  } catch (error) {
    console.error('Update wager amount error:', error);
  }
};
