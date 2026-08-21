import axios from "axios";

const rawBaseUrl = (
    import.meta.env.VITE_API_URL || "http://localhost:3000"
).trim().replace(/\/+$/, "");

export const API_BASE_URL = rawBaseUrl.endsWith("/api")
    ? rawBaseUrl.slice(0, -4)
    : rawBaseUrl;

// Alias so both import patterns work
export const getApiBaseUrl = () => API_BASE_URL;

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