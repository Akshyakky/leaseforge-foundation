import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton-loader";
import { ChevronRight, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface DataListItem {
  id: string | number;
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  rightContent?: React.ReactNode;
}

export interface DataListProps extends React.HTMLAttributes<HTMLDivElement> {
  items: DataListItem[];
  title?: string;
  isLoading?: boolean;
  onItemClick?: (item: DataListItem) => void;
  itemActions?: {
    label: string;
    onClick: (item: DataListItem) => void;
    icon?: React.ReactNode;
  }[];
  emptyState?: React.ReactNode;
}

export function DataList({ items, title, isLoading = false, onItemClick, itemActions, emptyState, className, ...props }: DataListProps) {
  if (isLoading) {
    return (
      <Card className={cn("w-full", className)} {...props}>
        {title && (
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
        )}
        <CardContent className="p-0">
          <div className="divide-y">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-[60%]" />
                  <Skeleton className="h-3 w-[80%]" />
                </div>
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0 && emptyState) {
    return (
      <Card className={cn("w-full", className)} {...props}>
        {title && (
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
        )}
        <CardContent>{emptyState}</CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)} {...props}>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className="p-0">
        <div className="divide-y">
          {items.map((item) => (
            <div
              key={item.id}
              className={cn("flex items-center gap-4 p-4", onItemClick && "hover:bg-muted/50 cursor-pointer transition-colors")}
              onClick={() => onItemClick && onItemClick(item)}
            >
              {item.icon && <div className="flex-shrink-0">{item.icon}</div>}
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{item.title}</div>
                {item.description && <div className="text-sm text-muted-foreground truncate">{item.description}</div>}
              </div>
              {item.rightContent && <div className="flex-shrink-0">{item.rightContent}</div>}
              {itemActions && (
                <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {itemActions.map((action, i) => (
                        <DropdownMenuItem key={i} onClick={() => action.onClick(item)}>
                          <div className="flex items-center gap-2">
                            {action.icon}
                            {action.label}
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
              {onItemClick && !itemActions && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
