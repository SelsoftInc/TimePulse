'use client';

import React, { useState } from 'react';
import './OvertimeConfirmationModal.css';

const OvertimeConfirmationModal = ({ isOpen, onClose, onConfirm, overtimeDays }) => {
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // Categorize days by type
  const weekendDays = overtimeDays.filter(d => d.isWeekend);
  const holidayDays = overtimeDays.filter(d => d.isHoliday);
  const overtimeDaysOnly = overtimeDays.filter(d => !d.isWeekend && !d.isHoliday && d.hours > 8);

  const handleConfirm = () => {
    if (!comment.trim()) {
      setError('Comment is mandatory. Please provide an explanation.');
      return;
    }

    onConfirm(comment);
    setComment('');
    setError('');
  };

  const handleCancel = () => {
    setComment('');
    setError('');
    onClose();
  };

  return (
    <div className="overtime-modal-overlay">
      <div className="overtime-modal">
        <div className="overtime-modal-header">
          <i className="fas fa-exclamation-triangle overtime-icon"></i>
          <h3>Overtime Hours Detected</h3>
        </div>

        <div className="overtime-modal-body">
          {/* Overtime Days (>8 hours on weekdays) */}
          {overtimeDaysOnly.length > 0 && (
            <div className="overtime-alert-message">
              <p><i className="fas fa-clock"></i> You have worked more than 8 hours on the following day(s):</p>
              <ul className="overtime-days-list">
                {overtimeDaysOnly.map((day, index) => (
                  <li key={index}>
                    <strong>{day.day}:</strong> {day.hours} hours
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Weekend Work Alert */}
          {weekendDays.length > 0 && (
            <div className="weekend-alert-message">
              <p><i className="fas fa-calendar-week"></i> You have worked on weekend(s):</p>
              <ul className="overtime-days-list">
                {weekendDays.map((day, index) => (
                  <li key={index}>
                    <strong>{day.day}:</strong> {day.hours} hours
                  </li>
                ))}
              </ul>
              <div className="alert-note">
                <i className="fas fa-info-circle"></i>
                <span>Weekend work requires manager approval and explanation.</span>
              </div>
            </div>
          )}

          {/* Holiday Work Alert */}
          {holidayDays.length > 0 && (
            <div className="holiday-alert-message">
              <p><i className="fas fa-umbrella-beach"></i> You have worked on holiday(s):</p>
              <ul className="overtime-days-list">
                {holidayDays.map((day, index) => (
                  <li key={index}>
                    <strong>{day.day}:</strong> {day.hours} hours {day.holidayName && <span className="holiday-name">({day.holidayName})</span>}
                  </li>
                ))}
              </ul>
              <div className="alert-note holiday-note">
                <i className="fas fa-exclamation-circle"></i>
                <span>Holiday work requires special authorization and explanation.</span>
              </div>
            </div>
          )}

          <div className="overtime-question">
            <p>Please confirm and provide an explanation for the above working hours.</p>
          </div>

          <div className="overtime-comment-section">
            <label htmlFor="overtime-comment" className="overtime-label">
              <span className="required-star">*</span> Please provide a detailed explanation:
            </label>
            <textarea
              id="overtime-comment"
              className={`overtime-textarea ${error ? 'error' : ''}`}
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                if (error) setError('');
              }}
              placeholder="Example: Project deadline, client meeting, urgent production issue, manager approval received, etc."
              rows="5"
            />
            {error && <div className="overtime-error-message">{error}</div>}
          </div>
        </div>

        <div className="overtime-modal-footer">
          <button 
            className="btn-overtime-cancel" 
            onClick={handleCancel}
          >
            <i className="fas fa-times"></i> Cancel
          </button>
          <button 
            className="btn-overtime-confirm" 
            onClick={handleConfirm}
          >
            <i className="fas fa-check"></i> Yes, Submit Timesheet
          </button>
        </div>
      </div>
    </div>
  );
};

export default OvertimeConfirmationModal;
