
import React, { useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

type ConfirmationDialogType = 'info' | 'success' | 'warning' | 'danger';

interface ConfirmOptions {
  title: string;
  description: string;
  cancelText?: string;
  confirmText?: string;
  type?: ConfirmationDialogType;
}

/**
 * Custom hook for showing confirmation dialogs
 */
export const useConfirmation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({
    title: '',
    description: '',
  });
  const [resolve, setResolve] = useState<(value: boolean) => void>(() => () => {});

  const confirm = useCallback((options: ConfirmOptions) => {
    setOptions(options);
    setIsOpen(true);
    
    return new Promise<boolean>((res) => {
      setResolve(() => res);
    });
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    resolve(false);
  }, [resolve]);

  const handleConfirm = useCallback(() => {
    setIsOpen(false);
    resolve(true);
  }, [resolve]);

  const confirmationDialog = (
    <ConfirmationDialog
      isOpen={isOpen}
      onClose={handleClose}
      onConfirm={handleConfirm}
      title={options.title}
      description={options.description}
      cancelText={options.cancelText}
      confirmText={options.confirmText}
      type={options.type}
    />
  );

  return {
    confirm,
    confirmationDialog,
  };
};

// Global utility function for showing confirmations outside of React components
let containerElement: HTMLDivElement | null = null;

export const showConfirmation = async (options: ConfirmOptions): Promise<boolean> => {
  return new Promise((resolve) => {
    if (!containerElement) {
      containerElement = document.createElement('div');
      document.body.appendChild(containerElement);
    }

    const root = createRoot(containerElement);
    
    const onClose = () => {
      root.unmount();
      resolve(false);
    };

    const onConfirm = () => {
      root.unmount();
      resolve(true);
    };

    root.render(
      <ConfirmationDialog
        isOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
        title={options.title}
        description={options.description}
        cancelText={options.cancelText}
        confirmText={options.confirmText}
        type={options.type}
      />
    );
  });
};
