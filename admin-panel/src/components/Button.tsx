'use client';

import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'ghost' | 'danger';

export function Button({ variant = 'primary', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const styles: Record<Variant, React.CSSProperties> = {
    primary: {
      background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
      color: '#ffffff',
      border: '1px solid rgba(2, 132, 199, 0.2)',
    },
    ghost: {
      background: '#ffffff',
      color: 'var(--text)',
      border: '1px solid var(--border)',
    },
    danger: {
      background: 'linear-gradient(135deg, #ef4444, #f97316)',
      color: '#ffffff',
      border: '1px solid rgba(239, 68, 68, 0.2)',
    },
  };

  return (
    <button
      {...props}
      style={{
        padding: '10px 18px',
        borderRadius: 12,
        cursor: 'pointer',
        fontWeight: 600,
        boxShadow: '0 10px 20px rgba(15, 23, 42, 0.08)',
        ...styles[variant],
        ...props.style,
      }}
    />
  );
}
