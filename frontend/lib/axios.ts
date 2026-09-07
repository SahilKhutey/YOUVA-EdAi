import axios from 'axios';

const isProduction = process.env.NODE_ENV === 'production';
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

if (isProduction && !apiUrl && typeof window !== 'undefined') {
    console.error('[CRITICAL] Missing NEXT_PUBLIC_API_URL environment variable in production.');
}

const api = axios.create({
    baseURL: apiUrl || (isProduction ? '' : 'http://localhost:3001'),
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
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
