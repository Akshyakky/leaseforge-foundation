
// src/services/AuthService.ts
import { BaseService, BaseRequest, BaseResponse } from "./BaseService";
import { toast } from "sonner";
import axios from "axios";

export interface LoginRequest {
  username: string;
  password: string;
  mode?: number;
  action?: string;
  parameters?: Record<string, any>;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user?: {
    userID: number;
    userName: string;
    userFullName: string;
    emailID: string;
    role: string;
    phoneNo?: string;
    departmentName?: string;
    roleName?: string;
    companyName?: string;
  };
  token?: string;
  refreshToken?: string;
  expiration?: string; // ISO date string from API
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ChangePasswordRequest {
  userID: number;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ResetPasswordRequest {
  username: string;
  email: string;
}

/**
 * Service for authentication and related operations
 */
class AuthService extends BaseService {
  constructor() {
    // Pass the endpoint to the base service
    super("/Auth");
  }

  /**
   * Log in a user
   * @param credentials - Login credentials
   * @returns LoginResponse with user data and tokens
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      // Format request body based on Mode 7 format if mode is specified
      const requestBody =
        credentials.mode === 7
          ? {
              mode: 7,
              action: credentials.action || "akshay",
              parameters: credentials.parameters || {},
              username: credentials.username,
              password: credentials.password,
            }
          : credentials;

      const response = await this.api.post<LoginResponse>("auth/login", requestBody);

      if (response.data.success && response.data.token) {
        // Store token, user info, and token expiration
        sessionStorage.setItem("token", response.data.token);
        localStorage.setItem("token", response.data.token);

        // Store token expiration time
        if (response.data.expiration) {
          localStorage.setItem("tokenExpiration", response.data.expiration);
        } else {
          // If no expiration provided, set default based on env variable
          const expiryHours = Number(import.meta.env.VITE_TOKEN_EXPIRY || 3600);
          const expiryTime = new Date();
          expiryTime.setSeconds(expiryTime.getSeconds() + expiryHours);
          localStorage.setItem("tokenExpiration", expiryTime.toISOString());
        }

        if (response.data.refreshToken) {
          localStorage.setItem("refreshToken", response.data.refreshToken);
          
          // Store refresh token expiration time
          const refreshExpiryHours = Number(import.meta.env.VITE_REFRESH_TOKEN_EXPIRY || 604800);
          const refreshExpiryTime = new Date();
          refreshExpiryTime.setSeconds(refreshExpiryTime.getSeconds() + refreshExpiryHours);
          localStorage.setItem("refreshTokenExpiration", refreshExpiryTime.toISOString());
        }

        return response.data;
      } else {
        throw new Error(response.data.message || "Login failed");
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const message = error.response.data?.message || "Login failed";
        toast.error(message);
        throw new Error(message);
      }
      toast.error("Network error. Please try again later.");
      throw error;
    }
  }

  /**
   * Refresh the authentication token
   * @param request - Refresh token request
   * @returns LoginResponse with new tokens
   */
  async refreshToken(request: RefreshTokenRequest): Promise<LoginResponse> {
    try {
      const response = await this.api.post<LoginResponse>("auth/refresh-token", request);

      if (response.data.success && response.data.token) {
        sessionStorage.setItem("token", response.data.token);
        localStorage.setItem("token", response.data.token);

        // Store token expiration time
        if (response.data.expiration) {
          localStorage.setItem("tokenExpiration", response.data.expiration);
        } else {
          // If no expiration provided, set default based on env variable
          const expiryHours = Number(import.meta.env.VITE_TOKEN_EXPIRY || 3600);
          const expiryTime = new Date();
          expiryTime.setSeconds(expiryTime.getSeconds() + expiryHours);
          localStorage.setItem("tokenExpiration", expiryTime.toISOString());
        }

        if (response.data.refreshToken) {
          localStorage.setItem("refreshToken", response.data.refreshToken);
          
          // Store refresh token expiration time
          const refreshExpiryHours = Number(import.meta.env.VITE_REFRESH_TOKEN_EXPIRY || 604800);
          const refreshExpiryTime = new Date();
          refreshExpiryTime.setSeconds(refreshExpiryTime.getSeconds() + refreshExpiryHours);
          localStorage.setItem("refreshTokenExpiration", refreshExpiryTime.toISOString());
        }

        return response.data;
      } else {
        throw new Error(response.data.message || "Token refresh failed");
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || "Token refresh failed");
      }
      throw error;
    }
  }

  /**
   * Change a user's password
   * @param request - Change password request
   * @returns true if successful, false otherwise
   */
  async changePassword(request: ChangePasswordRequest): Promise<boolean> {
    const response = await this.execute(
      {
        mode: 1, // Using mode for consistency, adapt as needed
        parameters: request,
      },
      false, // Don't show default toast
      { url: "/change-password" } // Override the URL
    );

    if (response.success) {
      toast.success("Password changed successfully");
      return true;
    } else {
      toast.error(response.message || "Failed to change password");
      return false;
    }
  }

  /**
   * Request a password reset
   * @param request - Reset password request
   * @returns true if successful, false otherwise
   */
  async resetPassword(request: ResetPasswordRequest): Promise<boolean> {
    const response = await this.execute(
      {
        mode: 1, // Using mode for consistency, adapt as needed
        parameters: request,
      },
      false, // Don't show default toast
      { url: "/reset-password" } // Override the URL
    );

    if (response.success) {
      toast.success("If an account exists with those details, a password reset email has been sent.");
      return true;
    } else {
      toast.error("An error occurred while processing your request");
      return false;
    }
  }

  /**
   * Check if token is expired
   * @returns true if token is expired or missing, false otherwise
   */
  isTokenExpired(): boolean {
    const token = sessionStorage.getItem("token") || localStorage.getItem("token");
    if (!token) {
      return true;
    }

    const expirationStr = localStorage.getItem("tokenExpiration");
    if (!expirationStr) {
      return true;
    }

    const expiration = new Date(expirationStr);
    return expiration <= new Date();
  }

  /**
   * Check if refresh token is expired
   * @returns true if refresh token is expired or missing, false otherwise
   */
  isRefreshTokenExpired(): boolean {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) {
      return true;
    }

    const expirationStr = localStorage.getItem("refreshTokenExpiration");
    if (!expirationStr) {
      return true;
    }

    const expiration = new Date(expirationStr);
    return expiration <= new Date();
  }

  /**
   * Log out the current user
   */
  logout(): void {
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("tokenExpiration");
    localStorage.removeItem("refreshTokenExpiration");
    sessionStorage.removeItem("token");
    localStorage.removeItem("token");
  }
}

// Export a singleton instance
export const authService = new AuthService();
