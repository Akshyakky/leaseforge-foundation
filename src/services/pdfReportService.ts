// src/services/pdfReportService.ts
import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { toast } from "sonner";
import { store } from "@/lib/store";

// Base interfaces for PDF generation
export interface GenerateReportRequest {
  reportType: string;
  parameters?: Record<string, any>;
  orientation?: "Portrait" | "Landscape";
  format?: "PDF" | "Excel" | "CSV";
}

export interface ReportConfiguration {
  title?: string;
  subTitle?: string;
  orientation?: "Portrait" | "Landscape";
  showLogo?: boolean;
  showCompanyInfo?: boolean;
  showFilters?: boolean;
  customSettings?: Record<string, any>;
}

export interface AvailableReport {
  reportType: string;
  displayName: string;
  description?: string;
  category?: string;
  defaultOrientation?: "Portrait" | "Landscape";
}

// Response interfaces
export interface PdfGenerationResponse {
  success: boolean;
  message?: string;
  data?: Blob;
  error?: string;
}

export interface ReportPreviewResponse {
  success: boolean;
  message?: string;
  data?: Blob;
  error?: string;
}

/**
 * Professional PDF Report Service
 * Provides a comprehensive, reusable solution for generating PDF reports
 */
export class PdfReportService {
  private api: AxiosInstance;
  private readonly baseEndpoint = "/pdf";

  constructor() {
    const API_URL = import.meta.env.VITE_API_URL || "https://localhost:7153/api";

    this.api = axios.create({
      baseURL: API_URL,
      headers: {
        "Content-Type": "application/json",
      },
      responseType: "blob", // Important for PDF downloads
    });

    // Set up request interceptor for authentication
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        if (token) {
          config.headers["Authorization"] = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Set up response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error("PDF Service Error:", error);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get current user information for audit trails
   */
  private getCurrentUser(): string {
    try {
      const state = store.getState();
      if (state?.auth?.user) {
        const user = state.auth.user;
        return user.name || user.fullName || `User_${user.id || "unknown"}`;
      }
    } catch (error) {
      console.warn("Error retrieving current user:", error);
    }
    return "SystemUser";
  }

  /**
   * Core method for generating any PDF report
   */
  private async generateReport(request: GenerateReportRequest, showToast = true): Promise<PdfGenerationResponse> {
    try {
      const response = await this.api.post(`${this.baseEndpoint}/generate`, request);

      if (response.data) {
        if (showToast) {
          toast.success("Report generated successfully");
        }
        return {
          success: true,
          data: response.data,
          message: "Report generated successfully",
        };
      }

      return {
        success: false,
        error: "No data received from server",
      };
    } catch (error) {
      const errorMessage = this.extractErrorMessage(error);

      if (showToast) {
        toast.error(errorMessage);
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Core method for previewing any PDF report
   */
  private async previewReport(request: GenerateReportRequest, showToast = true): Promise<ReportPreviewResponse> {
    try {
      const response = await this.api.post(`${this.baseEndpoint}/preview`, request);

      if (response.data) {
        return {
          success: true,
          data: response.data,
          message: "Report preview generated successfully",
        };
      }

      return {
        success: false,
        error: "No data received from server",
      };
    } catch (error) {
      const errorMessage = this.extractErrorMessage(error);

      if (showToast) {
        toast.error(errorMessage);
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Extract meaningful error messages from API responses
   */
  private extractErrorMessage(error: any): string {
    if (axios.isAxiosError(error)) {
      if (error.response?.data) {
        // Handle blob error responses
        if (error.response.data instanceof Blob) {
          return "Error generating PDF. Please try again.";
        }

        // Handle JSON error responses
        if (error.response.data.message) {
          return error.response.data.message;
        }
      }

      if (error.message) {
        return error.message;
      }
    }

    return "An unexpected error occurred while generating the report";
  }

  /**
   * Utility method to download PDF blob as file
   */
  public downloadPdfBlob(blob: Blob, filename: string): void {
    try {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`${filename} downloaded successfully`);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error("Error downloading PDF file");
    }
  }

  /**
   * Utility method to open PDF blob in new tab
   */
  public openPdfInNewTab(blob: Blob): void {
    try {
      const url = window.URL.createObjectURL(blob);
      const newWindow = window.open(url, "_blank");

      if (!newWindow) {
        toast.error("Popup blocked. Please allow popups and try again.");
        window.URL.revokeObjectURL(url);
        return;
      }

      // Clean up URL after a delay
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);
    } catch (error) {
      console.error("Error opening PDF:", error);
      toast.error("Error opening PDF file");
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Get available report types from server
   */
  async getAvailableReports(): Promise<AvailableReport[]> {
    try {
      // Temporarily change response type for this call
      const tempApi = axios.create({
        baseURL: this.api.defaults.baseURL,
        headers: this.api.defaults.headers,
      });

      // Add auth header
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (token) {
        tempApi.defaults.headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await tempApi.get(`${this.baseEndpoint}/available-reports`);

      if (response.data.success) {
        return response.data.data || [];
      }

      return [];
    } catch (error) {
      console.error("Error fetching available reports:", error);
      return [];
    }
  }

  /**
   * Get report configuration from server
   */
  async getReportConfiguration(reportType: string): Promise<ReportConfiguration | null> {
    try {
      // Temporarily change response type for this call
      const tempApi = axios.create({
        baseURL: this.api.defaults.baseURL,
        headers: this.api.defaults.headers,
      });

      // Add auth header
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (token) {
        tempApi.defaults.headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await tempApi.get(`${this.baseEndpoint}/configuration/${reportType}`);

      if (response.data.success) {
        return response.data.data || null;
      }

      return null;
    } catch (error) {
      console.error(`Error fetching configuration for ${reportType}:`, error);
      return null;
    }
  }

  /**
   * Generic report generation method for extensibility
   */
  async generateGenericReport(
    reportType: string,
    parameters: Record<string, any> = {},
    options: {
      orientation?: "Portrait" | "Landscape";
      download?: boolean;
      showToast?: boolean;
      filename?: string;
    } = {}
  ): Promise<PdfGenerationResponse> {
    const { orientation = "Portrait", download = true, showToast = true, filename } = options;

    const request: GenerateReportRequest = {
      reportType,
      orientation,
      parameters,
    };

    const response = await this.generateReport(request, showToast);

    if (response.success && response.data && download) {
      const defaultFilename = `${reportType.replace("-", "_")}_${new Date().toISOString().split("T")[0]}.pdf`;
      this.downloadPdfBlob(response.data, filename || defaultFilename);
    }

    return response;
  }
}

// Export singleton instance
export const pdfReportService = new PdfReportService();
