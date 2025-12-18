'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE } from '@/config/api';
import './GlobalSearch.css';

const GlobalSearch = () => {
  const router = useRouter();
  const { subdomain } = useParams();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const debounceTimer = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Perform search with debounce
  const performSearch = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setResults(null);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/search/global?query=${encodeURIComponent(searchQuery)}&tenantId=${user?.tenantId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setResults(data.results);
          setIsOpen(true);
          setSelectedIndex(-1);
        }
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.tenantId]);

  // Handle input change with debounce
  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer
    debounceTimer.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  // Get all results as flat array for keyboard navigation
  const getAllResults = () => {
    if (!results) return [];
    
    const allResults = [];
    
    if (results.navigation?.length > 0) {
      allResults.push(...results.navigation.map(item => ({ ...item, category: 'navigation' })));
    }
    if (results.employees?.length > 0) {
      allResults.push(...results.employees.map(item => ({ ...item, category: 'employees' })));
    }
    if (results.timesheets?.length > 0) {
      allResults.push(...results.timesheets.map(item => ({ ...item, category: 'timesheets' })));
    }
    if (results.invoices?.length > 0) {
      allResults.push(...results.invoices.map(item => ({ ...item, category: 'invoices' })));
    }
    if (results.leaveRequests?.length > 0) {
      allResults.push(...results.leaveRequests.map(item => ({ ...item, category: 'leaveRequests' })));
    }
    if (results.clients?.length > 0) {
      allResults.push(...results.clients.map(item => ({ ...item, category: 'clients' })));
    }
    if (results.vendors?.length > 0) {
      allResults.push(...results.vendors.map(item => ({ ...item, category: 'vendors' })));
    }
    
    return allResults;
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    const allResults = getAllResults();
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < allResults.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && allResults[selectedIndex]) {
        handleResultClick(allResults[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSelectedIndex(-1);
      inputRef.current?.blur();
    }
  };

  // Handle result click and navigation
  const handleResultClick = (result) => {
    setIsOpen(false);
    setQuery('');
    setResults(null);
    setSelectedIndex(-1);

    // Navigate based on result type
    switch (result.type) {
      case 'navigation':
        router.push(`/${subdomain}${result.path}`);
        break;
      
      case 'employee':
        router.push(`/${subdomain}/employees/${result.id}`);
        break;
      
      case 'timesheet':
        router.push(`/${subdomain}/timesheets/submit/${result.id}?mode=view`);
        break;
      
      case 'invoice':
        router.push(`/${subdomain}/invoices/${result.id}`);
        break;
      
      case 'leave':
        router.push(`/${subdomain}/leave-management?employeeId=${result.id}`);
        break;
      
      case 'client':
        router.push(`/${subdomain}/clients/${result.id}`);
        break;
      
      case 'vendor':
        router.push(`/${subdomain}/vendors/${result.id}`);
        break;
      
      default:
        console.log('Unknown result type:', result.type);
    }
  };

  // Render result item
  const renderResultItem = (result, index, globalIndex) => {
    const isSelected = globalIndex === selectedIndex;
    
    return (
      <div
        key={`${result.type}-${result.id || index}`}
        className={`search-result-item ${isSelected ? 'selected' : ''}`}
        onClick={() => handleResultClick(result)}
        onMouseEnter={() => setSelectedIndex(globalIndex)}
      >
        <div className="result-icon">
          <i className={`fas ${result.icon}`}></i>
        </div>
        <div className="result-content">
          <div className="result-label">{result.label}</div>
          {result.subtitle && (
            <div className="result-subtitle">{result.subtitle}</div>
          )}
        </div>
        {result.status && (
          <div className={`result-status status-${result.status.toLowerCase()}`}>
            {result.status}
          </div>
        )}
      </div>
    );
  };

  // Render results section
  const renderResultsSection = (title, items, startIndex) => {
    if (!items || items.length === 0) return null;

    return (
      <div className="search-results-section">
        <div className="section-title">{title}</div>
        <div className="section-items">
          {items.map((item, index) => 
            renderResultItem(item, index, startIndex + index)
          )}
        </div>
      </div>
    );
  };

  // Calculate start indices for each section
  const getStartIndices = () => {
    let currentIndex = 0;
    const indices = {};
    
    if (results?.navigation?.length > 0) {
      indices.navigation = currentIndex;
      currentIndex += results.navigation.length;
    }
    if (results?.employees?.length > 0) {
      indices.employees = currentIndex;
      currentIndex += results.employees.length;
    }
    if (results?.timesheets?.length > 0) {
      indices.timesheets = currentIndex;
      currentIndex += results.timesheets.length;
    }
    if (results?.invoices?.length > 0) {
      indices.invoices = currentIndex;
      currentIndex += results.invoices.length;
    }
    if (results?.leaveRequests?.length > 0) {
      indices.leaveRequests = currentIndex;
      currentIndex += results.leaveRequests.length;
    }
    if (results?.clients?.length > 0) {
      indices.clients = currentIndex;
      currentIndex += results.clients.length;
    }
    if (results?.vendors?.length > 0) {
      indices.vendors = currentIndex;
      currentIndex += results.vendors.length;
    }
    
    return indices;
  };

  const hasResults = results && (
    results.navigation?.length > 0 ||
    results.employees?.length > 0 ||
    results.timesheets?.length > 0 ||
    results.invoices?.length > 0 ||
    results.leaveRequests?.length > 0 ||
    results.clients?.length > 0 ||
    results.vendors?.length > 0
  );

  const indices = getStartIndices();

  return (
    <div className="global-search-container" ref={searchRef}>
      <div className="search-input-wrapper">
        <i className="fas fa-search search-icon"></i>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder="Search employees, clients, timesheets..."
          className="global-search-input"
        />
        {loading && (
          <i className="fas fa-spinner fa-spin search-loading"></i>
        )}
      </div>

      {isOpen && (
        <div className="search-results-dropdown">
          {hasResults ? (
            <>
              {renderResultsSection('Navigation', results.navigation, indices.navigation || 0)}
              {renderResultsSection('Employees', results.employees, indices.employees || 0)}
              {renderResultsSection('Timesheets', results.timesheets, indices.timesheets || 0)}
              {renderResultsSection('Invoices', results.invoices, indices.invoices || 0)}
              {renderResultsSection('Leave Requests', results.leaveRequests, indices.leaveRequests || 0)}
              {renderResultsSection('Clients', results.clients, indices.clients || 0)}
              {renderResultsSection('Vendors', results.vendors, indices.vendors || 0)}
            </>
          ) : (
            <div className="no-results">
              <i className="fas fa-search"></i>
              <p>No results found for "{query}"</p>
              <span>Try searching for employees, timesheets, invoices, or navigation items</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
