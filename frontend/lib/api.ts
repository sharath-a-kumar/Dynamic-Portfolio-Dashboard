/**
 * API client for backend communication
 */

import axios from 'axios';
import type { PortfolioResponse, RefreshResponse, HealthResponse } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Fetch portfolio data with live prices
 */
export async function fetchPortfolio(): Promise<PortfolioResponse> {
  const response = await apiClient.get<PortfolioResponse>('/api/portfolio');
  return response.data;
}

/**
 * Trigger manual refresh of portfolio data
 */
export async function refreshPortfolio(): Promise<RefreshResponse> {
  const response = await apiClient.get<RefreshResponse>('/api/portfolio/refresh');
  return response.data;
}

/**
 * Check backend service health
 */
export async function checkHealth(): Promise<HealthResponse> {
  const response = await apiClient.get<HealthResponse>('/api/health');
  return response.data;
}

export default apiClient;
