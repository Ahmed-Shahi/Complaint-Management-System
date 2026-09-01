import React from 'react';

const StatusBadge = ({ status }) => {
  const getStyle = (s) => {
    switch (s?.toUpperCase()) {
      case 'ACTIVE':
        return { bg: '#dcfce7', color: '#166534', border: '#bbf7d0' };
      case 'PENDING':
        return { bg: '#fef3c7', color: '#92400e', border: '#fde68a' };
      case 'IN_PROGRESS':
        return { bg: '#e0f2fe', color: '#075985', border: '#bae6fd' };
      case 'RESOLVED':
        return { bg: '#d1fae5', color: '#065f46', border: '#a7f3d0' };
      case 'REJECTED':
        return { bg: '#fee2e2', color: '#991b1b', border: '#fecaca' };
      case 'DEACTIVATED':
        return { bg: '#f3f4f6', color: '#374151', border: '#e5e7eb' };
      default:
        return { bg: '#f3f4f6', color: '#4b5563', border: '#e5e7eb' };
    }
  };

  const style = getStyle(status);

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 10px',
        fontSize: '12px',
        fontWeight: '600',
        borderRadius: '4px',
        backgroundColor: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}
    >
      {status ? status.replace('_', ' ') : 'N/A'}
    </span>
  );
};

export default StatusBadge;
