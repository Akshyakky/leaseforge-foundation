
import React from 'react';
import { z } from 'zod';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FormBuilder } from '@/components/forms/FormBuilder';
import { Item } from '@/pages/SampleModule';

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Item) => void;
  item: Item | null;
  mode: 'create' | 'edit' | 'view';
}

// Validation schema for item form
const itemSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  description: z.string().min(5, { message: "Description must be at least 5 characters" }),
  category: z.string().min(2, { message: "Category must be selected" }),
  price: z.number().min(0.01, { message: "Price must be greater than 0" }),
  stock: z.number().int().min(0, { message: "Stock cannot be negative" }),
  status: z.enum(['active', 'inactive', 'discontinued'], { 
    errorMap: () => ({ message: "Please select a valid status" })
  }),
  lastUpdated: z.string().optional(),
});

export const ItemModal: React.FC<ItemModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  item, 
  mode 
}) => {
  const defaultValues = item ?? {
    id: Math.floor(Math.random() * 1000),
    name: '',
    description: '',
    category: '',
    price: 0,
    stock: 0,
    status: 'active' as const,
    lastUpdated: new Date().toISOString().split('T')[0],
  };

  const handleSubmit = (data: any) => {
    const newItem = {
      ...data,
      lastUpdated: new Date().toISOString().split('T')[0],
      id: item?.id ?? defaultValues.id,
    };
    onSave(newItem as Item);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Add New Item' : mode === 'edit' ? 'Edit Item' : 'View Item'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' ? 'Fill in the details to create a new item.' 
             : mode === 'edit' ? 'Update the item details.' 
             : 'Item details.'}
          </DialogDescription>
        </DialogHeader>
        
        <FormBuilder
          fields={[
            {
              name: 'name',
              label: 'Name',
              type: 'text',
              placeholder: 'Enter item name',
              disabled: mode === 'view',
              description: 'The name of your product or item',
              required: true,
            },
            {
              name: 'description',
              label: 'Description',
              type: 'textarea',
              placeholder: 'Enter description',
              disabled: mode === 'view',
              description: 'A detailed description of the item',
              required: true,
            },
            {
              name: 'category',
              label: 'Category',
              type: 'select',
              placeholder: 'Select category',
              disabled: mode === 'view',
              options: [
                { label: 'Electronics', value: 'Electronics' },
                { label: 'Clothing', value: 'Clothing' },
                { label: 'Home Goods', value: 'Home Goods' },
                { label: 'Books', value: 'Books' },
                { label: 'Sports', value: 'Sports' },
                { label: 'Other', value: 'Other' },
              ],
              required: true,
            },
            {
              name: 'price',
              label: 'Price ($)',
              type: 'number',
              placeholder: '0.00',
              disabled: mode === 'view',
              description: 'Set the price for this item',
              required: true,
            },
            {
              name: 'stock',
              label: 'Stock',
              type: 'number',
              placeholder: '0',
              disabled: mode === 'view',
              description: 'Current available quantity',
              required: true,
            },
            {
              name: 'status',
              label: 'Status',
              type: 'select',
              placeholder: 'Select status',
              disabled: mode === 'view',
              options: [
                { label: 'Active', value: 'active' },
                { label: 'Inactive', value: 'inactive' },
                { label: 'Discontinued', value: 'discontinued' },
              ],
              required: true,
            },
          ]}
          schema={mode !== 'view' ? itemSchema : undefined}
          onSubmit={handleSubmit}
          defaultValues={defaultValues}
          submitText={mode === 'create' ? 'Create Item' : mode === 'edit' ? 'Update Item' : 'Close'}
          onCancel={mode !== 'view' ? onClose : undefined}
          cancelText="Cancel"
          successMessage={mode === 'create' ? 'Item created successfully!' : 'Item updated successfully!'}
          errorMessage="There was an error processing your request."
          isLoading={false}
        />
        
        {mode === 'view' && (
          <div className="flex justify-end mt-4">
            <Button onClick={onClose}>Close</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
