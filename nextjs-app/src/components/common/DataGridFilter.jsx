'use client';

import React from 'react';
import "./DataGridFilter.css";

const DataGridFilter = ({
  filters,
  onFilterChange,
  onClearFilters,
  resultCount,
  totalCount,
  className = ""}) => {
  const handleFilterChange = (filterKey, value) => {
    onFilterChange(filterKey, value);
  };

  const handleClearAll = () => {
    onClearFilters();
  };

  const hasActiveFilters = filters.some(
    (filter) =>
      filter.value !== filter.defaultValue &&
      filter.value !== "" &&
      filter.value !== "all"
  );

  return (
    <div className={`data-grid-filter ${className}`}>
      <div className="filter-header">
        <div className="filter-title">
          <i className="fas fa-filter mr-2"></i>
          Filters
          {hasActiveFilters && (
            <span className="active-filters-count">
              (
              {
                filters.filter(
                  (f) =>
                    f.value !== f.defaultValue &&
                    f.value !== "" &&
                    f.value !== "all"
                ).length
              }
              )
            </span>
          )}
        </div>
        <div className="filter-results">
          <span className="result-count">
            {resultCount} of {totalCount} items
          </span>
          {hasActiveFilters && (
            <button
              className="custom-btn custom-btn-sm custom-btn-outline ml-2"
              onClick={handleClearAll}
              title="Clear all filters"
            >
              <i className="custom-icon fas fa-times mr-1"></i>
              Clear All
            </button>
          )}
        </div>
      </div>

      <div className="filter-controls">
        {filters.map((filter) => (
          <div key={filter.key} className="filter-item">
            <label className="filter-label" htmlFor={filter.key}>
              {filter.label}:
            </label>

            {filter.type === "select" && (
              <select
                id={filter.key}
                className="form-select filter-select"
                value={filter.value}
                onChange={(e) => handleFilterChange(filter.key, e.target.value)}
              >
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}

            {filter.type === "text" && (
              <input
                id={filter.key}
                type="text"
                className="form-control filter-input"
                placeholder={filter.placeholder}
                value={filter.value}
                onChange={(e) => handleFilterChange(filter.key, e.target.value)}
              />
            )}

            {filter.type === "date" && (
              <input
                id={filter.key}
                type="date"
                className="form-control filter-input"
                value={filter.value}
                onChange={(e) => handleFilterChange(filter.key, e.target.value)}
              />
            )}

            {filter.type === "dateRange" && (
              <div className="date-range-filter">
                <input
                  type="date"
                  className="form-control filter-input"
                  placeholder="From"
                  value={filter.value.from || ""}
                  onChange={(e) =>
                    handleFilterChange(filter.key, {
                      ...filter.value,
                      from: e.target.value})
                  }
                />
                <span className="date-separator">to</span>
                <input
                  type="date"
                  className="form-control filter-input"
                  placeholder="To"
                  value={filter.value.to || ""}
                  onChange={(e) =>
                    handleFilterChange(filter.key, {
                      ...filter.value,
                      to: e.target.value})
                  }
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DataGridFilter;
