
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const cardVariants = cva(
  "transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border bg-card",
        primary: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        accent: "bg-accent text-accent-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "border bg-background",
        ghost: "border-0 bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface DashboardCardProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  value?: React.ReactNode;
  trend?: {
    value: number;
    label?: string;
    positive?: boolean;
  };
  footer?: React.ReactNode;
  loading?: boolean;
}

export function DashboardCard({
  className,
  variant,
  title,
  subtitle,
  icon,
  value,
  trend,
  footer,
  loading = false,
  children,
  ...props
}: DashboardCardProps) {
  if (loading) {
    return (
      <Card className={cn(cardVariants({ variant }), "cursor-default", className)} {...props}>
        <CardHeader className="space-y-0 pb-2">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="bg-muted/60 h-4 w-24 rounded-md animate-pulse" />
              <div className="bg-muted/60 h-3 w-32 rounded-md animate-pulse" />
            </div>
            <div className="bg-muted/60 h-8 w-8 rounded-full animate-pulse" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="bg-muted/60 h-8 w-28 rounded-md animate-pulse" />
            <div className="bg-muted/60 h-4 w-full rounded-md animate-pulse" />
          </div>
        </CardContent>
        <CardFooter>
          <div className="bg-muted/60 h-4 w-32 rounded-md animate-pulse" />
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className={cn(cardVariants({ variant }), "cursor-default", className)} {...props}>
      <CardHeader className="space-y-0 pb-2">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            {title && <CardTitle className="text-lg font-medium">{title}</CardTitle>}
            {subtitle && <CardDescription>{subtitle}</CardDescription>}
          </div>
          {icon && <div className="rounded-full p-2 bg-background/10">{icon}</div>}
        </div>
      </CardHeader>
      <CardContent>
        {value && <div className="text-2xl font-bold">{value}</div>}
        {trend && (
          <div className="flex items-center mt-1">
            <span className={cn(
              "text-sm font-medium",
              trend.positive ? "text-emerald-500" : "text-rose-500"
            )}>
              {trend.positive ? '+' : ''}{trend.value}% 
            </span>
            {trend.label && (
              <span className="text-sm text-muted-foreground ml-1">{trend.label}</span>
            )}
          </div>
        )}
        {children}
      </CardContent>
      {footer && <CardFooter>{footer}</CardFooter>}
    </Card>
  );
}
