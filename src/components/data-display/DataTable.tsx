import React, { useState, useEffect } from "react";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronUp, Download, Filter, MoreHorizontal, SlidersHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Card } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton-loader";

export interface Column<T> {
  header: string;
  accessorKey: keyof T;
  cell?: (info: { row: T }) => React.ReactNode;
  enableSorting?: boolean;
  enableFiltering?: boolean;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  onRowClick?: (row: T) => void;
  rowActions?: RowAction<T>[];
  pagination?: {
    pageSize: number;
    pageIndex: number;
    pageCount: number;
    onPageChange: (page: number) => void;
  };
}

export interface RowAction<T> {
  label: string;
  onClick: (row: T) => void;
  icon?: React.ReactNode;
}

export function DataTable<T extends Record<string, any>>({ data, columns, isLoading = false, onRowClick, rowActions, pagination }: DataTableProps<T>) {
  const { t } = useTranslation();
  const [sortColumn, setSortColumn] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [filterValue, setFilterValue] = useState("");
  const [displayData, setDisplayData] = useState<T[]>(data);
  const [currentData, setCurrentData] = useState<T[]>([]);

  // Sort and filter functionality
  useEffect(() => {
    let processedData = [...data];

    // Apply filtering
    if (filterValue) {
      processedData = processedData.filter((item) => {
        return Object.entries(item).some(([key, value]) => {
          if (typeof value === "string" || typeof value === "number") {
            return String(value).toLowerCase().includes(filterValue.toLowerCase());
          }
          return false;
        });
      });
    }

    // Apply sorting
    if (sortColumn) {
      processedData.sort((a, b) => {
        const aValue = a[sortColumn];
        const bValue = b[sortColumn];

        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }

        if (typeof aValue === "number" && typeof bValue === "number") {
          return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
        }

        return 0;
      });
    }

    setDisplayData(processedData);
  }, [data, filterValue, sortColumn, sortDirection]);

  // Pagination logic
  useEffect(() => {
    if (pagination) {
      const { pageSize, pageIndex } = pagination;
      const start = pageIndex * pageSize;
      const end = start + pageSize;
      setCurrentData(displayData.slice(start, end));
    } else {
      setCurrentData(displayData);
    }
  }, [displayData, pagination]);

  // Handle column sorting
  const handleSort = (column: Column<T>) => {
    if (!column.enableSorting) return;

    const isCurrentColumn = sortColumn === column.accessorKey;

    if (isCurrentColumn) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column.accessorKey);
      setSortDirection("asc");
    }
  };

  // Export to CSV
  const handleExport = () => {
    if (data.length === 0) return;

    const headers = columns.map((col) => col.header);
    const keys = columns.map((col) => col.accessorKey);

    const csvContent = [
      headers.join(","),
      ...displayData.map((row) =>
        keys
          .map((key) => {
            const cellValue = row[key];
            // Handle values that might contain commas
            if (typeof cellValue === "string" && cellValue.includes(",")) {
              return `"${cellValue}"`;
            }
            return cellValue;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "export.csv");
    link.click();
  };

  // Loading state for table
  if (isLoading) {
    return (
      <Card className="w-full overflow-hidden border">
        <div className="flex justify-between items-center p-4 border-b">
          <Skeleton className="h-6 w-[150px]" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-[180px]" />
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column, i) => (
                  <TableHead key={i}>
                    <Skeleton className="h-4 w-full max-w-[120px]" />
                  </TableHead>
                ))}
                {rowActions && <TableHead />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((_, colIndex) => (
                    <TableCell key={colIndex}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                  {rowActions && (
                    <TableCell>
                      <Skeleton className="h-8 w-8 rounded-full" />
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full overflow-hidden border">
      <div className="flex justify-between items-center p-4 border-b">
        <div className="font-medium">{t("common.results", { count: displayData.length })}</div>
        <div className="flex items-center gap-2">
          <Input placeholder={t("common.search")} value={filterValue} onChange={(e) => setFilterValue(e.target.value)} className="w-[180px]" />
          <Button variant="outline" size="icon" onClick={handleExport} title={t("common.export")}>
            <Download className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" title={t("common.columnSettings")}>
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {columns.map((column, index) => (
                <DropdownMenuItem key={index} className="capitalize">
                  {column.header}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, i) => (
                <TableHead key={i} className={column.enableSorting ? "cursor-pointer select-none" : ""} onClick={() => column.enableSorting && handleSort(column)}>
                  <div className="flex items-center gap-1">
                    {column.header}
                    {column.enableSorting &&
                      sortColumn === column.accessorKey &&
                      (sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
                  </div>
                </TableHead>
              ))}
              {rowActions && <TableHead />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (rowActions ? 1 : 0)} className="text-center py-8">
                  {t("common.noData")}
                </TableCell>
              </TableRow>
            ) : (
              currentData.map((row, rowIndex) => (
                <TableRow key={rowIndex} className={onRowClick ? "cursor-pointer hover:bg-muted" : ""} onClick={() => onRowClick && onRowClick(row)}>
                  {columns.map((column, colIndex) => (
                    <TableCell key={colIndex}>{column.cell ? column.cell({ row }) : row[column.accessorKey]}</TableCell>
                  ))}
                  {rowActions && (
                    <TableCell className="text-right p-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {rowActions.map((action, actionIndex) => (
                            <React.Fragment key={actionIndex}>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  action.onClick(row);
                                }}
                              >
                                <div className="flex items-center gap-2">
                                  {action.icon}
                                  {action.label}
                                </div>
                              </DropdownMenuItem>
                              {actionIndex < rowActions.length - 1 && <DropdownMenuSeparator />}
                            </React.Fragment>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {pagination && (
        <div className="flex items-center justify-between border-t p-4">
          <div className="text-sm text-muted-foreground">
            {t("common.page")} {pagination.pageIndex + 1} {t("common.of")} {pagination.pageCount || 1}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => pagination.onPageChange(pagination.pageIndex - 1)} disabled={pagination.pageIndex === 0}>
              {t("common.previous")}
            </Button>
            <Button variant="outline" size="sm" onClick={() => pagination.onPageChange(pagination.pageIndex + 1)} disabled={pagination.pageIndex >= pagination.pageCount - 1}>
              {t("common.next")}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
