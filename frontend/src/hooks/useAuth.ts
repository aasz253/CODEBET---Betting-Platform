import { useEffect } from 'react';
import { useWalletStore } from '../store/walletStore';
import axios from 'axios';

export const useFetchBalance = () => {
  const setBalance = useWalletStore((state) => state.setBalance);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const token = localStorage.getItem('codebet_token');
        if (!token) return;

        const response = await axios.get('/api/wallet/balance');
        setBalance(response.data.balance);
      } catch (error) {
        console.error('Failed to fetch balance:', error);
      }
    };

    fetchBalance();
  }, [setBalance]);
};
