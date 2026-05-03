import { create } from 'zustand'

interface WalletState {
  balance: number;
  setBalance: (balance: number) => void;
  deductBalance: (amount: number) => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  balance: 0,
  setBalance: (balance: number) => set({ balance }),
  deductBalance: (amount: number) => set((state: WalletState) => ({ 
    balance: Math.max(0, state.balance - amount) 
  })),
}))
