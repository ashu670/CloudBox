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
});

export default api;