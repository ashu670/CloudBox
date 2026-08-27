import axios from "axios";

export const getApiBaseUrl = () => {
    let envUrl = import.meta.env.VITE_API_URL;
    const isBrowser = typeof window !== "undefined";
    const isProductionHost = isBrowser && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1";

    if (!envUrl || (isProductionHost && (envUrl.includes("localhost") || envUrl.includes("127.0.0.1")))) {
        envUrl = "https://cloudbox-uttr.onrender.com";
    }
    return envUrl.trim().replace(/\/+$/, "").replace(/\/api$/, "");
};

export const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => Promise.reject(error));

// Silent Refresh Queue State
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Response Interceptor: Silent Access Token Refresh on 401
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response && error.response.status === 401 && originalRequest && !originalRequest._retry) {
            const reqUrl = originalRequest.url || "";
            if (reqUrl.includes("api/auth/login") || reqUrl.includes("api/auth/signup") || reqUrl.includes("api/auth/refresh")) {
                return Promise.reject(error);
            }

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                }).catch(err => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshUrl = `${API_BASE_URL}/api/auth/refresh`;
                const res = await axios.post(refreshUrl, {}, { withCredentials: true });
                const newAccessToken = res.data?.accessToken;

                if (newAccessToken) {
                    localStorage.setItem("accessToken", newAccessToken);
                    api.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

                    processQueue(null, newAccessToken);
                    isRefreshing = false;

                    return api(originalRequest);
                }
            } catch (refreshErr) {
                processQueue(refreshErr, null);
                isRefreshing = false;
                localStorage.removeItem("accessToken");
                localStorage.removeItem("user");

                if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
                    window.location.href = "/login";
                }
                return Promise.reject(refreshErr);
            }
        }

        return Promise.reject(error);
    }
);

export default api;