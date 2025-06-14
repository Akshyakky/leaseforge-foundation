// src/hooks/usePdfReports.ts
import { useState, useCallback, useMemo } from "react";
import { pdfReportService, PdfGenerationResponse, ReportPreviewResponse, AvailableReport, ReportConfiguration } from "@/services/pdfReportService";

// Base hook state interface
interface PdfReportState {
  isLoading: boolean;
  error: string | null;
  data: Blob | null;
}

// Enhanced state for operations that may have additional data
interface PdfOperationState extends PdfReportState {
  lastOperation: string | null;
  operationCount: number;
}

/**
 * Base hook for PDF report operations
 * Provides common state management and error handling
 */
export function usePdfReportBase() {
  const [state, setState] = useState<PdfOperationState>({
    isLoading: false,
    error: null,
    data: null,
    lastOperation: null,
    operationCount: 0,
  });

  const resetState = useCallback(() => {
    setState((prev) => ({
      ...prev,
      error: null,
      data: null,
    }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState((prev) => ({ ...prev, isLoading: loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({
      ...prev,
      error,
      isLoading: false,
      data: null,
    }));
  }, []);

  const setSuccess = useCallback((data: Blob, operation: string) => {
    setState((prev) => ({
      ...prev,
      isLoading: false,
      error: null,
      data,
      lastOperation: operation,
      operationCount: prev.operationCount + 1,
    }));
  }, []);

  return {
    ...state,
    resetState,
    setLoading,
    setError,
    setSuccess,
  };
}

/**
 * Hook for managing available reports and configurations
 * Provides methods for fetching report metadata from the server
 */
export function useReportMetadata() {
  const [availableReports, setAvailableReports] = useState<AvailableReport[]>([]);
  const [configurations, setConfigurations] = useState<Record<string, ReportConfiguration>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAvailableReports = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const reports = await pdfReportService.getAvailableReports();
      setAvailableReports(reports);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch available reports";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchReportConfiguration = useCallback(
    async (reportType: string) => {
      if (configurations[reportType]) {
        return configurations[reportType];
      }

      try {
        const config = await pdfReportService.getReportConfiguration(reportType);
        if (config) {
          setConfigurations((prev) => ({ ...prev, [reportType]: config }));
          return config;
        }
      } catch (error) {
        console.error(`Failed to fetch configuration for ${reportType}:`, error);
      }

      return null;
    },
    [configurations]
  );

  const getReportByType = useCallback(
    (reportType: string) => {
      return availableReports.find((report) => report.reportType === reportType);
    },
    [availableReports]
  );

  const getReportsByCategory = useCallback(
    (category: string) => {
      return availableReports.filter((report) => report.category === category);
    },
    [availableReports]
  );

  // Group reports by category for easier UI organization
  const reportsByCategory = useMemo(() => {
    return availableReports.reduce((acc, report) => {
      const category = report.category || "General";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(report);
      return acc;
    }, {} as Record<string, AvailableReport[]>);
  }, [availableReports]);

  return {
    availableReports,
    configurations,
    reportsByCategory,
    isLoading,
    error,
    fetchAvailableReports,
    fetchReportConfiguration,
    getReportByType,
    getReportsByCategory,
  };
}

/**
 * Generic hook for any PDF report type
 * Provides a flexible interface for custom reports
 */
export function useGenericPdfReport() {
  const baseHook = usePdfReportBase();

  const generateReport = useCallback(
    async (
      reportType: string,
      parameters: Record<string, any> = {},
      options: {
        orientation?: "Portrait" | "Landscape";
        download?: boolean;
        showToast?: boolean;
        filename?: string;
      } = {}
    ): Promise<PdfGenerationResponse> => {
      baseHook.setLoading(true);
      baseHook.resetState();

      try {
        const response = await pdfReportService.generateGenericReport(reportType, parameters, options);

        if (response.success && response.data) {
          baseHook.setSuccess(response.data, `${reportType}-generate`);
        } else {
          baseHook.setError(response.error || `Failed to generate ${reportType} report`);
        }

        return response;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unexpected error occurred";
        baseHook.setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [baseHook]
  );

  return {
    ...baseHook,
    generateReport,
    downloadCurrentPdf: (filename?: string) => {
      if (baseHook.data) {
        const defaultFilename = `${baseHook.lastOperation?.replace("-", "_")}_${new Date().toISOString().split("T")[0]}.pdf`;
        pdfReportService.downloadPdfBlob(baseHook.data, filename || defaultFilename);
      }
    },
    openCurrentPdfInNewTab: () => {
      if (baseHook.data) {
        pdfReportService.openPdfInNewTab(baseHook.data);
      }
    },
    hasData: !!baseHook.data,
    canDownload: !!baseHook.data && !baseHook.isLoading,
  };
}
