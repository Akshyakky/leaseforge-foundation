
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton, CardSkeleton, TableSkeleton } from '@/components/ui/skeleton-loader';
import { DialogExamples } from '@/components/examples/DialogExamples';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowRight, 
  CheckCircle, 
  Sparkles, 
  Bell, 
  BellRing, 
  Check, 
  Ban, 
  Info, 
  AlertTriangle, 
  X 
} from 'lucide-react';
import { toast } from 'sonner';

const UIExamples = () => {
  const [activeTab, setActiveTab] = useState('buttons');
  
  const handleToast = (type: 'default' | 'success' | 'error' | 'warning' | 'info') => {
    switch (type) {
      case 'success':
        toast.success('Operation completed', {
          description: 'Your action was successful.',
        });
        break;
      case 'error':
        toast.error('Operation failed', {
          description: 'There was an error processing your request.',
        });
        break;
      case 'warning':
        toast.warning('Proceed with caution', {
          description: 'This action might have consequences.',
        });
        break;
      case 'info':
        toast.info('For your information', {
          description: 'Just letting you know something.',
        });
        break;
      default:
        toast('Notification message', {
          description: 'This is a standard notification.',
        });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-4">UI Components</h1>
        <p className="text-muted-foreground mb-8">
          Examples of the UI components available in the application.
        </p>
      </div>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full flex flex-wrap justify-start mb-6 gap-1">
          <TabsTrigger value="buttons">Buttons</TabsTrigger>
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="cards">Cards</TabsTrigger>
          <TabsTrigger value="forms">Form Elements</TabsTrigger>
          <TabsTrigger value="skeletons">Skeleton Loaders</TabsTrigger>
          <TabsTrigger value="dialogs">Dialogs</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        {/* Buttons Tab */}
        <TabsContent value="buttons" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Button Variants</CardTitle>
              <CardDescription>
                Different button styles for various use cases.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <Button>Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Button Sizes</CardTitle>
              <CardDescription>
                Buttons come in different sizes to fit your layout.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-4">
              <Button size="lg">Large</Button>
              <Button>Default</Button>
              <Button size="sm">Small</Button>
              <Button size="icon"><Check /></Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Buttons with Icons</CardTitle>
              <CardDescription>
                Combine icons and text for clearer actions.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <Button>
                <Check className="mr-2 h-4 w-4" /> Accept
              </Button>
              <Button variant="secondary">
                <Ban className="mr-2 h-4 w-4" /> Decline
              </Button>
              <Button variant="outline">
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="destructive">
                <X className="mr-2 h-4 w-4" /> Cancel
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Badges Tab */}
        <TabsContent value="badges" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Badge Variants</CardTitle>
              <CardDescription>
                Different badge styles for statuses and labels.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="outline">Outline</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Badges with Icons</CardTitle>
              <CardDescription>
                Combine icons and text for richer badges.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <Badge className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" /> Verified
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> New
              </Badge>
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Critical
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Info className="h-3 w-3" /> Info
              </Badge>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cards Tab */}
        <TabsContent value="cards" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Card</CardTitle>
                <CardDescription>
                  A simple card with header and content.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>This is the main content area of the card.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Card with Footer</CardTitle>
                <CardDescription>
                  A card with a footer for actions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>This card includes a footer with action buttons.</p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline">Cancel</Button>
                <Button>Submit</Button>
              </CardFooter>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Interactive Card</CardTitle>
                <CardDescription>
                  A card with interactive elements.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p>This card contains various interactive components.</p>
                  <div className="flex flex-wrap gap-4">
                    <Button>Action</Button>
                    <Badge>Status</Badge>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-muted-foreground">
                  Last updated: 2 hours ago
                </p>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        {/* Form Elements Tab */}
        <TabsContent value="forms" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Input Elements</CardTitle>
              <CardDescription>
                Basic form input components.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" placeholder="Enter your email" type="email" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" placeholder="Enter your password" type="password" />
              </div>
              
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox id="terms" />
                <Label htmlFor="terms" className="text-sm">
                  Accept terms and conditions
                </Label>
              </div>
              
              <div className="pt-2">
                <Button className="w-full">Sign In</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Skeleton Loaders Tab */}
        <TabsContent value="skeletons" className="space-y-6">
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
          
          <Card>
            <CardHeader>
              <CardTitle>Table Skeleton</CardTitle>
              <CardDescription>Loading state for tables</CardDescription>
            </CardHeader>
            <CardContent>
              <TableSkeleton />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dialogs Tab */}
        <TabsContent value="dialogs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Modal & Dialog System</CardTitle>
              <CardDescription>Interactive dialogs and modals</CardDescription>
            </CardHeader>
            <CardContent>
              <DialogExamples />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Toast Notifications</CardTitle>
              <CardDescription>Different types of toast notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={() => handleToast('default')}>
                  <Bell className="mr-2 h-4 w-4" />
                  Default Toast
                </Button>
                <Button variant="outline" className="text-green-600" onClick={() => handleToast('success')}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Success Toast
                </Button>
                <Button variant="outline" className="text-red-600" onClick={() => handleToast('error')}>
                  <X className="mr-2 h-4 w-4" />
                  Error Toast
                </Button>
                <Button variant="outline" className="text-amber-600" onClick={() => handleToast('warning')}>
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Warning Toast
                </Button>
                <Button variant="outline" className="text-blue-600" onClick={() => handleToast('info')}>
                  <Info className="mr-2 h-4 w-4" />
                  Info Toast
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UIExamples;
