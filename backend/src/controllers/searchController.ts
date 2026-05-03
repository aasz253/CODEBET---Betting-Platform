import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const searchEvents = async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;

    if (!query || query.trim().length < 2) {
      return res.json({ events: [] });
    }

    const searchTerm = query.trim().toLowerCase();

    const events = await prisma.event.findMany({
      where: {
        OR: [
          { homeTeam: { contains: searchTerm, mode: 'insensitive' } },
          { awayTeam: { contains: searchTerm, mode: 'insensitive' } },
          { league: { contains: searchTerm, mode: 'insensitive' } },
          { sport: { contains: searchTerm, mode: 'insensitive' } },
        ],
        status: { not: 'CANCELLED' },
      },
      include: {
        markets: {
          include: {
            odds: {
              where: { isActive: true, current: true },
            },
          },
        },
      },
      orderBy: { startTime: 'asc' },
      take: 20,
    });

    const results = events.map((event) => ({
      id: event.id,
      sport: event.sport,
      league: event.league,
      homeTeam: event.homeTeam,
      awayTeam: event.awayTeam,
      startTime: event.startTime,
      status: event.status,
      markets: event.markets.map((market) => ({
        id: market.id,
        type: market.type,
        name: market.name,
        odds: market.odds.map((odd) => ({
          id: odd.id,
          value: Number(odd.value),
          isActive: odd.isActive,
        })),
      })),
    }));

    res.json({ events: results });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
};
