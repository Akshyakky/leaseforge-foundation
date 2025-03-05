
import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export const Skeleton = ({ className }: SkeletonProps) => {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted/60", 
        className
      )}
    />
  );
};

export const CardSkeleton = () => {
  return (
    <div className="space-y-3">
      <Skeleton className="h-8 w-[200px]" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
};

export const TableRowSkeleton = () => {
  return (
    <div className="flex items-center space-x-4 rounded-md p-2">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </div>
  );
};

export const TableSkeleton = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-[250px]" />
        <Skeleton className="h-8 w-[200px]" />
      </div>
      <div className="rounded-md border">
        <div className="flex justify-between p-4 border-b">
          <Skeleton className="h-6 w-[120px]" />
          <Skeleton className="h-6 w-[120px]" />
          <Skeleton className="h-6 w-[120px]" />
        </div>
        <div className="p-4 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRowSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
};

export const DashboardSkeleton = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-[150px]" />
        <div className="flex space-x-2">
          <Skeleton className="h-8 w-[120px]" />
          <Skeleton className="h-8 w-[100px]" />
        </div>
      </div>
      
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-4 border rounded-md">
            <div className="flex justify-between items-center mb-4">
              <Skeleton className="h-4 w-[80px]" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <Skeleton className="h-8 w-[100px] mb-2" />
            <Skeleton className="h-4 w-full" />
            <div className="mt-3 flex items-center">
              <Skeleton className="h-4 w-[150px]" />
            </div>
          </div>
        ))}
      </div>
      
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <div className="col-span-1 lg:col-span-2 border rounded-md p-4">
          <Skeleton className="h-6 w-[200px] mb-2" />
          <Skeleton className="h-4 w-[250px] mb-6" />
          <Skeleton className="h-[300px] w-full" />
        </div>
        
        <div className="border rounded-md p-4">
          <Skeleton className="h-6 w-[150px] mb-2" />
          <Skeleton className="h-4 w-[200px] mb-6" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      </div>
    </div>
  );
};
