import apiClient from './client';

export const mockPurchaseAndBind = (payload) => apiClient.post('/contract/mock/purchase', payload);
export const mockUpgradeLevel = (payload) => apiClient.post('/contract/mock/upgrade', payload);
export const mockSendDynamicReward = (payload) => apiClient.post('/contract/mock/reward', payload);
