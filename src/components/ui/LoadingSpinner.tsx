import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
}

/**
 * Accessible loading spinner with optional full-screen overlay.
 * Uses role="status" + aria-live so screen readers announce it.
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading…',
  fullScreen = false,
}) => {
  const style: React.CSSProperties = fullScreen
    ? {
        position: 'fixed',
        inset: 0,
        zIndex: 999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-surface)',
        gap: '1rem',
      }
    : {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1rem',
        gap: '0.75rem',
      };

  return (
    <div role="status" aria-live="polite" aria-label={message} style={style}>
      <svg
        width="36" height="36" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
        aria-hidden="true"
        style={{
          color: 'var(--color-primary)',
          animation: 'spin 0.85s linear infinite',
        }}
      >
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      </svg>
      <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>
        {message}
      </span>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
