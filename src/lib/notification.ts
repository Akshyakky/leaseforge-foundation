
import { v4 as uuidv4 } from 'uuid';
import { store } from '@/lib/store';
import { addNotification, removeNotification } from '@/features/ui/uiSlice';
import { toast } from 'sonner';

type NotificationType = 'info' | 'success' | 'warning' | 'error';

interface NotificationOptions {
  /** Duration in milliseconds, defaults to 5000 (5 seconds). Set to 0 for persistent notification */
  duration?: number;
  /** Whether to show a toast alongside the notification */
  toast?: boolean;
}

const defaultOptions: NotificationOptions = {
  duration: 5000,
  toast: true,
};

export const notify = (
  message: string,
  type: NotificationType = 'info',
  options: NotificationOptions = {}
) => {
  const mergedOptions = { ...defaultOptions, ...options };
  const id = uuidv4();
  
  // Add to the notifications store
  store.dispatch(
    addNotification({
      id,
      message,
      type,
    })
  );
  
  // Show toast if enabled
  if (mergedOptions.toast) {
    switch (type) {
      case 'success':
        toast.success(message);
        break;
      case 'error':
        toast.error(message);
        break;
      case 'warning':
        toast.warning(message);
        break;
      case 'info':
      default:
        toast.info(message);
        break;
    }
  }
  
  // Auto-dismiss after duration if set
  if (mergedOptions.duration) {
    setTimeout(() => {
      store.dispatch(removeNotification(id));
    }, mergedOptions.duration);
  }
  
  return id;
};

// Helper functions for common notification types
export const notifySuccess = (message: string, options?: NotificationOptions) => 
  notify(message, 'success', options);

export const notifyError = (message: string, options?: NotificationOptions) => 
  notify(message, 'error', options);

export const notifyWarning = (message: string, options?: NotificationOptions) => 
  notify(message, 'warning', options);

export const notifyInfo = (message: string, options?: NotificationOptions) => 
  notify(message, 'info', options);
