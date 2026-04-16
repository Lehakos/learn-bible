import { useCallback, useEffect, useRef, useState } from 'react';
import { NotificationKind, subscribeToNotifications, type NotificationEvent } from '../services/notifications';
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from './ui/toast';

interface ToastMessage extends NotificationEvent {
  id: string;
  open: boolean;
}

function toastToneClass(kind: NotificationKind): string {
  switch (kind) {
    case NotificationKind.LEVEL:
      return 'border-amber-300 bg-amber-50/95 text-amber-900';
    case NotificationKind.ACHIEVEMENT:
      return 'border-blue-300 bg-blue-50/95 text-blue-900';
    case NotificationKind.ITEM:
      return 'border-emerald-300 bg-emerald-50/95 text-emerald-900';
    default:
      return '';
  }
}

export function NotificationToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const timeoutById = useRef<Record<string, number>>({});

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    const timeoutId = timeoutById.current[id];
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      delete timeoutById.current[id];
    }
  }, []);

  const setToastOpen = useCallback(
    (id: string, open: boolean) => {
      if (open) return;

      setToasts((prev) =>
        prev.map((toast) => (toast.id === id ? { ...toast, open: false } : toast)),
      );
      window.setTimeout(() => removeToast(id), 180);
    },
    [removeToast],
  );

  const addToast = useCallback(
    (notification: NotificationEvent) => {
      const id = crypto.randomUUID();
      const toast: ToastMessage = {
        ...notification,
        id,
        open: true,
      };

      setToasts((prev) => [toast, ...prev].slice(0, 4));

      const closeTimeout = window.setTimeout(() => {
        setToastOpen(id, false);
      }, notification.duration ?? 4000);

      timeoutById.current[id] = closeTimeout;
    },
    [setToastOpen],
  );

  useEffect(() => {
    const unsubscribe = subscribeToNotifications((notification) => addToast(notification));
    return () => {
      unsubscribe();
      Object.values(timeoutById.current).forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
      timeoutById.current = {};
    };
  }, [addToast]);

  return (
    <ToastProvider>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          open={toast.open}
          onOpenChange={(open) => setToastOpen(toast.id, open)}
          className={toastToneClass(toast.kind)}
        >
          <div className="flex flex-1 items-start gap-3 pr-4">
            {toast.emoji && <span className="mt-0.5 text-xl leading-none">{toast.emoji}</span>}
            <div className="space-y-1">
              <ToastTitle>{toast.title}</ToastTitle>
              <ToastDescription>{toast.description}</ToastDescription>
            </div>
          </div>
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}
