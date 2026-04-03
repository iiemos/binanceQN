import apiClient from './client';

export const fetchAgentCode = () => apiClient.get('/agent/code');
export const setAgentCode = (code) => apiClient.post('/agent/code', { code });
export const deleteAgentCode = () => apiClient.delete('/agent/code');

export const fetchAgentEarnings = () => apiClient.get('/agent/earnings');
export const withdrawAgentEarnings = (amount) => apiClient.post('/agent/withdraw', { amount });
export const fetchAgentWithdrawHistory = (params) => apiClient.get('/agent/withdraw/history', { params });

export const fetchAgentTeam = () => apiClient.get('/agent/team');
