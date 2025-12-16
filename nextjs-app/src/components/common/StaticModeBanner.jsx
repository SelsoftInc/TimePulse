'use client';

import { useState, useEffect } from 'react';
import './StaticModeBanner.css';

export default function StaticModeBanner() {
  const [isStatic, setIsStatic] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const staticMode = localStorage.getItem('staticMode') === 'true';
    setIsStatic(staticMode);
  }, []);

  if (!isStatic || !isVisible) return null;

  return (
    <div className="static-mode-banner">
      <div className="static-mode-content">
        <div className="static-mode-icon">🔧</div>
        <div className="static-mode-text">
          <strong>UI Development Mode</strong>
          <span>Using static data - Backend server not connected</span>
        </div>
        <button 
          className="static-mode-close"
          onClick={() => setIsVisible(false)}
          aria-label="Close banner"
        >
          ×
        </button>
      </div>
    </div>
  );
}
