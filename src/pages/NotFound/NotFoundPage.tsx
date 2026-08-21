import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export const NotFoundPage: React.FC = () => {
  const location = useLocation();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: '4rem 1.5rem',
        textAlign: 'center',
      }}
      role="main"
      aria-labelledby="not-found-heading"
    >
      {/* Large 404 */}
      <div
        style={{
          fontSize: 'clamp(5rem, 20vw, 9rem)',
          fontWeight: 900,
          lineHeight: 1,
          color: 'var(--color-primary-light)',
          letterSpacing: '-0.04em',
          marginBottom: '1rem',
          WebkitTextStroke: '2px var(--color-primary)',
        }}
        aria-hidden="true"
      >
        404
      </div>

      <h1
        id="not-found-heading"
        style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem' }}
      >
        Page Not Found
      </h1>
      <p
        style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', maxWidth: 380, marginBottom: '0.5rem' }}
      >
        The URL <code style={{ fontSize: '0.8125rem', background: 'var(--bg-main)', padding: '1px 6px', borderRadius: 4 }}>{location.pathname}</code> does not exist or has been moved.
      </p>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '2.5rem' }}>
        Here are some pages that might help:
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center' }}>
        <Link
          to="/"
          style={{
            padding: '0.625rem 1.25rem',
            background: 'var(--color-primary)',
            color: '#fff',
            borderRadius: '9999px',
            fontWeight: 700,
            fontSize: '0.875rem',
            textDecoration: 'none',
          }}
        >
          ← Home
        </Link>
        <Link
          to="/calculator"
          style={{
            padding: '0.625rem 1.25rem',
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '9999px',
            fontWeight: 600,
            fontSize: '0.875rem',
            textDecoration: 'none',
          }}
        >
          Loan Calculator
        </Link>
        <Link
          to="/insurance"
          style={{
            padding: '0.625rem 1.25rem',
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '9999px',
            fontWeight: 600,
            fontSize: '0.875rem',
            textDecoration: 'none',
          }}
        >
          Insurance
        </Link>
        <Link
          to="/contact"
          style={{
            padding: '0.625rem 1.25rem',
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '9999px',
            fontWeight: 600,
            fontSize: '0.875rem',
            textDecoration: 'none',
          }}
        >
          Contact Us
        </Link>
      </div>
    </div>
  );
};
