import axios from 'axios';

export const PRIMARY_SERVER = 'https://eos-server.aquanex.online';
export const SECONDARY_SERVER = 'https://eos-server-jxy0.onrender.com';

let activeServer = PRIMARY_SERVER;

export const getActiveServer = () => activeServer;

export const switchToSecondary = () => {
    if (activeServer === PRIMARY_SERVER) {
        console.warn('Switching to secondary server (forced).');
        activeServer = SECONDARY_SERVER;
        api.defaults.baseURL = `${activeServer}/api`;
    }
};

const api = axios.create({
    baseURL: `${activeServer}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add the auth token header to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle 401 Unauthorized responses and server failover
api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Check for network error (primary server down)
        if (!error.response && !originalRequest._retry) {
            if (activeServer === PRIMARY_SERVER) {
                console.warn('Primary server unreachable. Switching to secondary server.');
                activeServer = SECONDARY_SERVER;
                api.defaults.baseURL = `${activeServer}/api`;
                originalRequest.baseURL = `${activeServer}/api`;
                originalRequest._retry = true;
                return api(originalRequest);
            }
        }

        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            // Clear local storage and redirect to home page
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);

export default api;
