'use client';

import React from 'react';

const HourlyRateModal = ({ 
  isOpen, 
  employee, 
  hourlyRate, 
  onHourlyRateChange, 
  onSave, 
  onCancel, 
  isSaving 
}) => {
  if (!isOpen || !employee) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px'
      }}
      onClick={onCancel}
    >
      <div 
        style={{
          backgroundColor: 'var(--card-bg, #ffffff)',
          borderRadius: '12px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          maxWidth: '500px',
          width: '100%',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid var(--border-color, #e5e7eb)',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}>
          <h3 style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: '700',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <i className="fas fa-dollar-sign"></i>
            Set Hourly Rate
          </h3>
          <p style={{
            margin: '8px 0 0 0',
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.9)',
            lineHeight: '1.5'
          }}>
            Employee <strong>"{employee.firstName} {employee.lastName}"</strong> does not have an hourly rate set.
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--text-primary, #1f2937)'
            }}>
              Hourly Rate (USD) <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '16px',
                fontWeight: '600',
                color: 'var(--text-secondary, #6b7280)'
              }}>
                $
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={hourlyRate}
                onChange={(e) => onHourlyRateChange(e.target.value)}
                placeholder="45.00"
                autoFocus
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 32px',
                  border: '2px solid var(--border-color, #d1d5db)',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  background: 'var(--input-bg, #ffffff)',
                  color: 'var(--text-primary, #1f2937)',
                  outline: 'none',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border-color, #d1d5db)'}
                disabled={isSaving}
              />
            </div>
            <p style={{
              marginTop: '8px',
              fontSize: '12px',
              color: 'var(--text-secondary, #6b7280)',
              fontStyle: 'italic'
            }}>
              <i className="fas fa-info-circle" style={{ marginRight: '4px' }}></i>
              This rate will be saved to the employee profile and used for invoice generation.
            </p>
          </div>

          <div style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderLeft: '4px solid #3b82f6',
            borderRadius: '6px'
          }}>
            <p style={{
              margin: 0,
              fontSize: '13px',
              color: '#1e40af',
              lineHeight: '1.5'
            }}>
              <i className="fas fa-lightbulb" style={{ marginRight: '6px' }}></i>
              After setting the hourly rate, the invoice will be generated automatically.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
          borderTop: '1px solid var(--border-color, #e5e7eb)',
          background: 'var(--bg-secondary, #f9fafb)'
        }}>
          <button
            onClick={onCancel}
            disabled={isSaving}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--bg-secondary, #f3f4f6)',
              color: 'var(--text-secondary, #6b7280)',
              fontSize: '14px',
              fontWeight: '600',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              opacity: isSaving ? 0.6 : 1,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!isSaving) {
                e.target.style.background = '#e5e7eb';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'var(--bg-secondary, #f3f4f6)';
            }}
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={isSaving || !hourlyRate || parseFloat(hourlyRate) <= 0}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: hourlyRate && parseFloat(hourlyRate) > 0 && !isSaving 
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                : '#9ca3af',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: '600',
              cursor: hourlyRate && parseFloat(hourlyRate) > 0 && !isSaving ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              boxShadow: hourlyRate && parseFloat(hourlyRate) > 0 && !isSaving 
                ? '0 4px 6px -1px rgba(102, 126, 234, 0.3)' 
                : 'none'
            }}
            onMouseEnter={(e) => {
              if (hourlyRate && parseFloat(hourlyRate) > 0 && !isSaving) {
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 6px 12px -2px rgba(102, 126, 234, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = hourlyRate && parseFloat(hourlyRate) > 0 && !isSaving 
                ? '0 4px 6px -1px rgba(102, 126, 234, 0.3)' 
                : 'none';
            }}
          >
            {isSaving ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Updating...
              </>
            ) : (
              <>
                <i className="fas fa-check"></i>
                Save & Generate Invoice
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HourlyRateModal;
