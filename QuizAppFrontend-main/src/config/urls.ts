const backendUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

export const BACKEND_URL = backendUrl.replace(/\/$/, '');
export const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL ?? 'http://localhost:5173';

export const getBackendUrl = () => BACKEND_URL;
export const getFrontendUrl = () => FRONTEND_URL.replace(/\/$/, '');
