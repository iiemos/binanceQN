import apiClient from './client';

export const fetchUserInfo = () => apiClient.get('/user/info');
export const fetchHomeConfig = () => apiClient.get('/user/home-config');
export const bindBinanceUid = (uid) => apiClient.post('/user/bind-uid', { uid });
export const fetchUserTree = (depth = 2) => apiClient.get('/user/tree', { params: { depth } });
export const fetchCommissionList = (params) => apiClient.get('/commission/list', { params });
export const fetchMyCode = () => apiClient.get('/code/my');
export const fetchUpgradeOrder = () => apiClient.get('/order/upgrade');
