// Central API base URL configuration
// In Vercel multi-service deployment or local Vite proxy, requests route via relative '/api'
// Can be overridden via VITE_API_URL environment variable if needed
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
