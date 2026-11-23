import { toast } from 'react-hot-toast';

/**
 * Simple wrapper around react-hot-toast to show a toast message.
 * Type can be 'success' | 'error' | 'info'.
 */
export function showToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
  if (type === 'success') {
    toast.success(message);
  } else if (type === 'error') {
    toast.error(message);
  } else {
    toast(message);
  }
}
