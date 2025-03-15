// src/services/BaseService.ts
import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { toast } from "sonner";

// Base request interface for all API calls
export interface BaseRequest {
  mode: number;
  actionBy?: string;
  parameters?: Record<string, any>;
}

// Base response interface
export interface BaseResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  table1?: any[];
  table2?: any[];
  [key: string]: any;
}

/**
 * Base service class that handles common functionality for API calls
 */
export class BaseService {
  protected api: AxiosInstance;
  protected endpoint: string;

  /**
   * Create a new service instance
   * @param endpoint - The API endpoint path (e.g., "/Master/user")
   */
  constructor(endpoint: string) {
    const API_URL = import.meta.env.VITE_API_URL || "https://localhost:7153/api";

    this.endpoint = endpoint;
    this.api = axios.create({
      baseURL: API_URL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Set up interceptor to include token in requests
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        if (token) {
          config.headers["Authorization"] = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  /**
   * Execute an API request and handle common response/error patterns
   * @param request - The request object
   * @param showToast - Whether to show toast notifications for errors
   * @param config - Additional axios request config
   * @returns A promise with the response data
   */
  protected async execute<T = any>(request: BaseRequest, showToast = true, config?: AxiosRequestConfig): Promise<BaseResponse<T>> {
    try {
      const response = await this.api.post<BaseResponse<T>>(this.endpoint, request, config);

      if (!response.data.success && showToast) {
        toast.error(response.data.message || "An error occurred");
      }

      return response.data;
    } catch (error) {
      if (showToast) {
        if (axios.isAxiosError(error) && error.response?.data?.message) {
          toast.error(error.response.data.message);
        } else {
          toast.error("An error occurred while processing your request");
        }
      }

      console.error(`Error in ${this.endpoint} request:`, error);

      return {
        success: false,
        message: axios.isAxiosError(error) && error.response?.data?.message ? error.response.data.message : "An error occurred",
      };
    }
  }

  /**
   * Helper method to show a success toast
   * @param message - The message to display
   */
  protected showSuccess(message: string): void {
    toast.success(message);
  }
}
