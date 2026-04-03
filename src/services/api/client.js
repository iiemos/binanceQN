import axios from 'axios';

const DEFAULT_WALLET = '0x0000000000000000000000000000000000001111';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 15000
});

apiClient.interceptors.request.use((config) => {
  const token = window.localStorage.getItem('user_token');
  const walletAddress = window.localStorage.getItem('wallet_address') || DEFAULT_WALLET;
  const role = window.localStorage.getItem('user_role') || 'user';

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers['x-wallet-address'] = walletAddress;
  config.headers['x-user-address'] = walletAddress;
  config.headers['x-role'] = role;
  return config;
});

export default apiClient;
