import { create } from 'zustand'

interface Bet {
  eventId: string;
  marketId: string;
  oddsValue: number;
  homeTeam: string;
  awayTeam: string;
  marketType: string;
  stake?: number;
  oddsChanged?: boolean;
  previousOdds?: number;
}

interface BetslipState {
  bets: Bet[];
  addBet: (bet: Bet) => void;
  removeBet: (index: number) => void;
  clearBetslip: () => void;
  updateStake: (index: number, stake: number) => void;
  getTotalStake: () => number;
  getTotalPotentialWin: () => number;
  updateOddsValue: (marketId: string, newValue: number) => void;
  clearOddsChanged: () => void;
}

export const useBetslipStore = create<BetslipState>((set, get) => ({
  bets: [],
  addBet: (bet) => set((state) => {
    const exists = state.bets.findIndex(b => 
      b.eventId === bet.eventId && b.marketId === bet.marketId
    );
    if (exists >= 0) {
      const newBets = [...state.bets];
      newBets[exists] = bet;
      return { bets: newBets };
    }
    return { bets: [...state.bets, bet] };
  }),
  removeBet: (index) => set((state) => ({
    bets: state.bets.filter((_, i) => i !== index)
  })),
  clearBetslip: () => set({ bets: [] }),
  updateStake: (index, stake) => set((state) => {
    const newBets = [...state.bets];
    newBets[index] = { ...newBets[index], stake };
    return { bets: newBets };
  }),
  getTotalStake: () => {
    const { bets } = get();
    return bets.reduce((sum, bet) => sum + (bet.stake || 0), 0);
  },
  getTotalPotentialWin: () => {
    const { bets } = get();
    return bets.reduce((sum, bet) => sum + (bet.stake || 0) * bet.oddsValue, 0);
  },
  updateOddsValue: (marketId, newValue) => set((state) => {
    const newBets = state.bets.map(bet => {
      if (bet.marketId === marketId) {
        return { ...bet, oddsValue: newValue, oddsChanged: true, previousOdds: bet.oddsValue };
      }
      return bet;
    });
    return { bets: newBets };
  }),
  clearOddsChanged: () => set((state) => {
    const newBets = state.bets.map(bet => ({ ...bet, oddsChanged: false }));
    return { bets: newBets };
  }),
}));

export type { Bet };
