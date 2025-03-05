
import React from 'react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useModal } from '@/hooks/use-modal';
import { useConfirmation, showConfirmation } from '@/hooks/use-confirmation';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';

export const DialogExamples = () => {
  // Basic modal example
  const modal = useModal();
  
  // Confirmation dialog with hook
  const { confirm, confirmationDialog } = useConfirmation();
  
  const handleBasicModal = () => {
    modal.open();
  };
  
  const handleConfirmation = async () => {
    const confirmed = await confirm({
      title: 'Are you sure?',
      description: 'This action cannot be undone. This will permanently delete the file.',
      type: 'danger',
      confirmText: 'Delete',
    });
    
    if (confirmed) {
      toast({
        title: 'File deleted',
        description: 'The file has been permanently deleted.',
      });
    }
  };
  
  const handleGlobalConfirmation = async () => {
    const confirmed = await showConfirmation({
      title: 'Confirm Submission',
      description: 'Are you sure you want to submit this form? You cannot change your answers after submission.',
      type: 'warning',
      confirmText: 'Submit',
    });
    
    if (confirmed) {
      toast({
        title: 'Form submitted',
        description: 'Your form has been successfully submitted.',
        variant: 'default',
      });
    }
  };
  
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h2 className="text-xl font-medium">Modal Dialog Examples</h2>
        <div className="flex flex-wrap gap-4">
          <Button onClick={handleBasicModal}>Open Modal</Button>
          <Button onClick={handleConfirmation} variant="destructive">Delete File</Button>
          <Button onClick={handleGlobalConfirmation} variant="outline">Submit Form</Button>
        </div>
      </div>
      
      {/* Basic Modal */}
      <Modal
        isOpen={modal.isOpen}
        onClose={modal.close}
        title="User Profile"
        description="Update your profile information"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={modal.close}>Cancel</Button>
            <Button onClick={() => {
              toast({ title: 'Profile updated', description: 'Your profile has been successfully updated.' });
              modal.close();
            }}>Save Changes</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" defaultValue="John Doe" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" defaultValue="john.doe@example.com" />
          </div>
        </div>
      </Modal>
      
      {/* Confirmation Dialog */}
      {confirmationDialog}
    </div>
  );
};
