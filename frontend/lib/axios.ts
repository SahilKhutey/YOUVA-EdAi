import axios from 'axios';

const isProduction = process.env.NODE_ENV === 'production';
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

if (isProduction && !apiUrl && typeof window !== 'undefined') {
    console.error('[CRITICAL] Missing NEXT_PUBLIC_API_URL environment variable in production.');
}

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL;
const normalizedBaseUrl = rawApiUrl
    ? (rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl.replace(/\/$/, '')}/api`)
    : 'http://localhost:3001/api';

const api = axios.create({
    baseURL: normalizedBaseUrl,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    if (config.url && config.url.startsWith('/api/')) {
        config.url = config.url.substring(4);
    }
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle global errors here (e.g. 401 logout)
        return Promise.reject(error);
    }
);

export default api;
