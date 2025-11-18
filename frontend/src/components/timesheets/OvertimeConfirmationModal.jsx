import React, { useState } from 'react';
import './OvertimeConfirmationModal.css';

const OvertimeConfirmationModal = ({ isOpen, onClose, onConfirm, overtimeDays }) => {
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!comment.trim()) {
      setError('Comment is mandatory. Please explain why you worked more than 8 hours.');
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
          <div className="overtime-alert-message">
            <p>You have worked more than 8 hours on the following day(s):</p>
            <ul className="overtime-days-list">
              {overtimeDays.map((day, index) => (
                <li key={index}>
                  <strong>{day.day}:</strong> {day.hours} hours
                </li>
              ))}
            </ul>
          </div>

          <div className="overtime-question">
            <p>Have you worked more than 8 hours on {overtimeDays.length > 1 ? 'these days' : 'this day'}?</p>
          </div>

          <div className="overtime-comment-section">
            <label htmlFor="overtime-comment" className="overtime-label">
              <span className="required-star">*</span> Please provide a comment explaining the overtime:
            </label>
            <textarea
              id="overtime-comment"
              className={`overtime-textarea ${error ? 'error' : ''}`}
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                if (error) setError('');
              }}
              placeholder="Example: Project deadline, client meeting, urgent bug fix, etc."
              rows="4"
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
