import apiClient from './client';

export const loginByWallet = (address, signature = 'wallet-connect-signature') =>
  apiClient.post('/auth/login', { address, signature });
