import React from 'react';
import { Link } from 'react-router-dom';
import { useRelatedEnquiries, RelatedEnquiryItem } from '../../../hooks';
import { formatIndianCurrency } from '../../../lib/calculator';

interface RelatedEnquiriesCardProps {
  mobile: string | null | undefined;
  currentLeadId: string;
  currentCategory: 'loan' | 'insurance';
  onOpenLead?: (lead: RelatedEnquiryItem) => void;
}

const formatDate = (iso?: string | null) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
};

const getStatusBadgeStyle = (status: string) => {
  switch (status) {
    case 'NEW':
      return { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' };
    case 'CONTACTED':
      return { bg: '#fefce8', color: '#854d0e', border: '#fef08a' };
    case 'INTERESTED':
      return { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' };
    case 'DOCUMENTS_COLLECTED':
    case 'LOGGED':
      return { bg: '#faf5ff', color: '#6b21a8', border: '#e9d5ff' };
    case 'APPROVED':
    case 'DISBURSED':
      return { bg: '#ecfdf5', color: '#047857', border: '#6ee7b7' };
    case 'LOST':
    case 'REJECTED':
      return { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' };
    default:
      return { bg: '#f3f4f6', color: '#374151', border: '#e5e7eb' };
  }
};

export const RelatedEnquiriesCard: React.FC<RelatedEnquiriesCardProps> = ({
  mobile,
  currentLeadId,
  currentCategory,
  onOpenLead,
}) => {
  const { relatedEnquiries, totalSubmissionsCount, isRepeatCustomer, loading } =
    useRelatedEnquiries(mobile, currentLeadId, currentCategory);

  return (
    <div
      className="lead-modal-section related-enquiries-section"
      style={{
        marginTop: '1.25rem',
        padding: '1.25rem',
        backgroundColor: '#f8fafc',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
      }}
    >
      {/* Header with Title and Unverified Status Tag */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginBottom: '1rem',
          borderBottom: '1px solid #e2e8f0',
          paddingBottom: '0.75rem',
        }}
      >
        <div>
          <h4
            style={{
              fontSize: '0.9375rem',
              fontWeight: 600,
              color: '#0f172a',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span>Customer Enquiry Intelligence</span>
            {isRepeatCustomer && (
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '0.2rem 0.6rem',
                  borderRadius: '9999px',
                  backgroundColor: '#fef3c7',
                  color: '#92400e',
                  border: '1px solid #fde68a',
                }}
              >
                Repeat Customer • {totalSubmissionsCount} Total Enquiries
              </span>
            )}
          </h4>
          <p
            style={{
              fontSize: '0.8125rem',
              color: '#64748b',
              margin: '0.25rem 0 0 0',
            }}
          >
            Cross-service activity history for this contact number.
          </p>
        </div>

        {/* Unverified Phone Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.25rem 0.625rem',
            backgroundColor: '#f1f5f9',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            fontSize: '0.75rem',
            fontWeight: 500,
            color: '#475569',
          }}
          title="Customer entered this mobile number. Phone ownership is not verified via SMS OTP."
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{ width: '0.875rem', height: '0.875rem', color: '#64748b' }}
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <span>Phone: Unverified</span>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div style={{ fontSize: '0.8125rem', color: '#64748b', padding: '0.5rem 0' }}>
          Checking cross-service enquiries...
        </div>
      ) : relatedEnquiries.length === 0 ? (
        <div
          style={{
            fontSize: '0.8125rem',
            color: '#64748b',
            padding: '0.5rem 0',
            fontStyle: 'italic',
          }}
        >
          No other enquiries found for this mobile number in your organization. (First recorded enquiry).
        </div>
      ) : (
        <div>
          <div
            style={{
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: '#334155',
              marginBottom: '0.625rem',
            }}
          >
            Related Enquiries ({relatedEnquiries.length})
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.625rem',
            }}
          >
            {relatedEnquiries.map((item) => {
              const badgeStyle = getStatusBadgeStyle(item.status);
              const isLoan = item.category === 'loan';

              return (
                <div
                  key={`${item.category}-${item.id}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#ffffff',
                    padding: '0.75rem 1rem',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    fontSize: '0.875rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        backgroundColor: isLoan ? '#eff6ff' : '#f0fdf4',
                        color: isLoan ? '#1e40af' : '#166534',
                        border: `1px solid ${isLoan ? '#bfdbfe' : '#bbf7d0'}`,
                      }}
                    >
                      {isLoan ? 'Loan' : 'Insurance'}
                    </span>

                    <span style={{ fontWeight: 600, color: '#0f172a' }}>
                      {item.productName}
                    </span>

                    {item.amount && (
                      <span style={{ color: '#059669', fontWeight: 500, fontSize: '0.8125rem' }}>
                        {formatIndianCurrency(item.amount)}
                      </span>
                    )}

                    <span style={{ color: '#64748b', fontSize: '0.8125rem' }}>
                      • {formatDate(item.createdAt)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '9999px',
                        backgroundColor: badgeStyle.bg,
                        color: badgeStyle.color,
                        border: `1px solid ${badgeStyle.border}`,
                      }}
                    >
                      {item.status}
                    </span>

                    {onOpenLead ? (
                      <button
                        type="button"
                        onClick={() => onOpenLead(item)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#2563eb',
                          fontSize: '0.8125rem',
                          fontWeight: 500,
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          padding: '0.25rem 0.5rem',
                        }}
                      >
                        View &rarr;
                      </button>
                    ) : (
                      <Link
                        to={item.linkUrl}
                        style={{
                          color: '#2563eb',
                          fontSize: '0.8125rem',
                          fontWeight: 500,
                          textDecoration: 'underline',
                          padding: '0.25rem 0.5rem',
                        }}
                      >
                        View &rarr;
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
