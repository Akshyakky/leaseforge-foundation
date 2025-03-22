import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import { toast } from "sonner";

// Create axios instance
const api = axios.create({
  baseURL: "/api", // This would be replaced with actual API URL in production
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status;

      if (status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        toast.error("Your session has expired. Please log in again.");
      } else if (status === 403) {
        toast.error("You do not have permission to perform this action.");
      } else if (status === 404) {
        toast.error("The requested resource was not found.");
      } else if (status >= 500) {
        toast.error("A server error occurred. Please try again later.");
      }
    } else if (error.request) {
      toast.error("No response received from server. Please check your connection.");
    } else {
      toast.error("An unexpected error occurred.");
    }

    return Promise.reject(error);
  }
);

// API request helpers
export const apiService = {
  get: <T>(url: string, config?: AxiosRequestConfig) => api.get<T>(url, config).then((response) => response.data),

  post: <T>(url: string, data?: any, config?: AxiosRequestConfig) => api.post<T>(url, data, config).then((response) => response.data),

  put: <T>(url: string, data?: any, config?: AxiosRequestConfig) => api.put<T>(url, data, config).then((response) => response.data),

  patch: <T>(url: string, data?: any, config?: AxiosRequestConfig) => api.patch<T>(url, data, config).then((response) => response.data),

  delete: <T>(url: string, config?: AxiosRequestConfig) => api.delete<T>(url, config).then((response) => response.data),
};

export default api;
