'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

/**
 * Toast notification types
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * Toast notification data
 */
export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Toast context value
 */
interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

/**
 * Generate unique ID for toasts
 */
function generateId(): string {
  return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Toast Provider Props
 */
export interface ToastProviderProps {
  children: ReactNode;
  /**
   * Maximum number of toasts to display at once
   */
  maxToasts?: number;
  /**
   * Default duration for toasts in milliseconds
   */
  defaultDuration?: number;
}

/**
 * Toast Provider Component
 * 
 * Provides toast notification functionality to the application.
 * Wrap your app with this provider to enable toast notifications.
 */
export function ToastProvider({
  children,
  maxToasts = 5,
  defaultDuration = 5000,
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<Toast, 'id'>): string => {
      const id = generateId();
      const newToast: Toast = {
        ...toast,
        id,
        duration: toast.duration ?? defaultDuration,
      };

      setToasts((prev) => {
        const updated = [...prev, newToast];
        // Limit number of toasts
        if (updated.length > maxToasts) {
          return updated.slice(-maxToasts);
        }
        return updated;
      });

      return id;
    },
    [defaultDuration, maxToasts]
  );

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

/**
 * Hook to use toast notifications
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}


/**
 * Toast Container Props
 */
interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

/**
 * Toast Container Component
 * 
 * Renders all active toast notifications in a fixed position.
 */
function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

/**
 * Toast Item Props
 */
interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

/**
 * Individual Toast Item Component
 */
function ToastItem({ toast, onRemove }: ToastItemProps) {
  const { id, type, title, message, duration, action } = toast;

  // Auto-dismiss after duration
  useEffect(() => {
    if (duration && duration > 0) {
      const timer = setTimeout(() => {
        onRemove(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onRemove]);

  // Get styles based on toast type
  const styles = getToastStyles(type);

  return (
    <div
      className={`pointer-events-auto rounded-lg shadow-lg p-4 transform transition-all duration-300 ease-out animate-slide-in ${styles.container}`}
      role="alert"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">{styles.icon}</div>
        <div className="ml-3 flex-1">
          <p className={`text-sm font-medium ${styles.title}`}>{title}</p>
          {message && (
            <p className={`mt-1 text-sm ${styles.message}`}>{message}</p>
          )}
          {action && (
            <button
              onClick={() => {
                action.onClick();
                onRemove(id);
              }}
              className={`mt-2 text-sm font-medium ${styles.action} hover:underline focus:outline-none`}
            >
              {action.label}
            </button>
          )}
        </div>
        <button
          onClick={() => onRemove(id)}
          className={`ml-4 flex-shrink-0 rounded-md inline-flex ${styles.closeButton} focus:outline-none focus:ring-2 focus:ring-offset-2`}
          aria-label="Dismiss notification"
        >
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

/**
 * Get toast styles based on type
 */
function getToastStyles(type: ToastType) {
  switch (type) {
    case 'success':
      return {
        container: 'bg-green-50 dark:bg-green-900/90 border border-green-200 dark:border-green-700',
        title: 'text-green-800 dark:text-green-200',
        message: 'text-green-700 dark:text-green-300',
        action: 'text-green-600 dark:text-green-400',
        closeButton: 'text-green-500 hover:text-green-600 dark:text-green-400 dark:hover:text-green-300 focus:ring-green-500',
        icon: (
          <svg className="h-5 w-5 text-green-500 dark:text-green-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        ),
      };
    case 'error':
      return {
        container: 'bg-red-50 dark:bg-red-900/90 border border-red-200 dark:border-red-700',
        title: 'text-red-800 dark:text-red-200',
        message: 'text-red-700 dark:text-red-300',
        action: 'text-red-600 dark:text-red-400',
        closeButton: 'text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 focus:ring-red-500',
        icon: (
          <svg className="h-5 w-5 text-red-500 dark:text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        ),
      };
    case 'warning':
      return {
        container: 'bg-yellow-50 dark:bg-yellow-900/90 border border-yellow-200 dark:border-yellow-700',
        title: 'text-yellow-800 dark:text-yellow-200',
        message: 'text-yellow-700 dark:text-yellow-300',
        action: 'text-yellow-600 dark:text-yellow-400',
        closeButton: 'text-yellow-500 hover:text-yellow-600 dark:text-yellow-400 dark:hover:text-yellow-300 focus:ring-yellow-500',
        icon: (
          <svg className="h-5 w-5 text-yellow-500 dark:text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        ),
      };
    case 'info':
    default:
      return {
        container: 'bg-blue-50 dark:bg-blue-900/90 border border-blue-200 dark:border-blue-700',
        title: 'text-blue-800 dark:text-blue-200',
        message: 'text-blue-700 dark:text-blue-300',
        action: 'text-blue-600 dark:text-blue-400',
        closeButton: 'text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 focus:ring-blue-500',
        icon: (
          <svg className="h-5 w-5 text-blue-500 dark:text-blue-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        ),
      };
  }
}

export default ToastProvider;
