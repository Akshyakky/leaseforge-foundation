
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton, CardSkeleton, TableSkeleton } from '@/components/ui/skeleton-loader';
import { DialogExamples } from '@/components/examples/DialogExamples';

const UIExamples = () => {
  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-4">UI Components</h1>
        <p className="text-muted-foreground mb-8">
          Examples of the UI components available in the application.
        </p>
      </div>

      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Skeleton Loaders</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Card Skeleton</CardTitle>
                <CardDescription>Skeleton loader for cards</CardDescription>
              </CardHeader>
              <CardContent>
                <CardSkeleton />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Customizable Skeletons</CardTitle>
                <CardDescription>Create skeletons with any dimensions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div>
          <h2 className="text-2xl font-semibold mb-4">Table Skeleton</h2>
          <Card>
            <CardContent className="p-6">
              <TableSkeleton />
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Modal & Dialog System</h2>
          <Card>
            <CardContent className="p-6">
              <DialogExamples />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UIExamples;
