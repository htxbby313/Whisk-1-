import React from 'react';

interface ToastProps {
  toast: { message: string; type: 'error' | 'success' } | null;
}

export default function Toast({ toast }: ToastProps) {
  if (!toast) return null;
  const bg = toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600';
  return (
    <div
      className={`fixed top-4 inset-x-0 mx-auto max-w-md px-4 py-3 rounded shadow-lg text-white ${bg} z-50`}
    >
      {toast.message}
    </div>
  );
}
