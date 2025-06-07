// src/services/BaseService.ts
import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { toast } from "sonner";
import { store } from "@/lib/store";

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
   * Get the current user's information for action attribution
   * @returns The username or a default value
   */
  protected getCurrentUser(): string {
    try {
      // Get current user from Redux store
      const state = store.getState();

      // Check if auth state and user exist
      if (state && state.auth && state.auth.user) {
        const user = state.auth.user;

        // Return username, name, or ID in that order of preference
        return user.name || user.name || user.name || user.fullName || `User_${user.id || user.id || "unknown"}`;
      }
    } catch (error) {
      console.warn("Error retrieving current user from store:", error);
    }

    // Return a default identifier if we can't get the user info
    return "SystemUser";
  }

  /**
   * Helper method to get the current user ID
   * @returns The current user ID
   */
  protected getCurrentUserId(): number | undefined {
    try {
      // Get current user from Redux store
      const state = store.getState();
      if (state && state.auth && state.auth.user) {
        return state.auth.user.id;
      }
    } catch (error) {
      console.warn("Error retrieving current user ID from store:", error);
    }
    return undefined;
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
      // Create a new request object with the current user as actionBy
      // If actionBy is already provided, use that value; otherwise, get the current user
      const requestWithUser = {
        ...request,
        actionBy: request.actionBy !== undefined ? request.actionBy : this.getCurrentUser(),
      };

      const response = await this.api.post<BaseResponse<T>>(this.endpoint, requestWithUser, config);

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
