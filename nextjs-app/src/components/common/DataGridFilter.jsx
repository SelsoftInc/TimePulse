'use client';

import React from 'react';
import './DataGridFilter.css';

const DataGridFilter = ({
  filters,
  onFilterChange,
  onClearFilters,
  resultCount,
  totalCount,
  className = '',
}) => {
  const handleFilterChange = (filterKey, value) => {
    onFilterChange(filterKey, value);
  };

  const handleClearAll = () => {
    onClearFilters();
  };

  const hasActiveFilters = filters.some(
    (filter) =>
      filter.value !== filter.defaultValue &&
      filter.value !== '' &&
      filter.value !== 'all'
  );

  return (
    <div className={`data-grid-filter ${className}`}>
      {/* ===== HEADER ===== */}
      <div className="filter-header flex items-center justify-between mb-3">
        <div className="filter-title text-sm font-semibold text-slate-700 flex items-center">
          <i className="fas fa-filter mr-2 text-xs" />
          Filters
          {hasActiveFilters && (
            <span className="active-filters-count ml-1 text-xs text-indigo-600">
              (
              {
                filters.filter(
                  (f) =>
                    f.value !== f.defaultValue &&
                    f.value !== '' &&
                    f.value !== 'all'
                ).length
              }
              )
            </span>
          )}
        </div>

        <div className="filter-results flex items-center gap-2 text-xs text-slate-500">
          <span className="result-count">
            {resultCount} of {totalCount} items
          </span>

          {hasActiveFilters && (
            <button
              className="custom-btn custom-btn-sm custom-btn-outline"
              onClick={handleClearAll}
              title="Clear all filters"
            >
              <i className="custom-icon fas fa-times mr-1" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ===== CONTROLS ===== */}
      <div className="filter-controls grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {filters.map((filter) => (
          <div key={filter.key} className="filter-item">
            <label
              className="filter-label block mb-1 text-[11px] font-medium text-slate-600"
              htmlFor={filter.key}
            >
              {filter.label}
            </label>

            {/* ===== SELECT ===== */}
            {filter.type === 'select' && (
              <select
                id={filter.key}
                className="
                  w-full h-9
                  rounded-md
                  bg-white border border-slate-300
                  px-2 text-xs text-slate-800
                  focus:outline-none focus:ring-1 focus:ring-indigo-500
                "
                value={filter.value}
                onChange={(e) =>
                  handleFilterChange(filter.key, e.target.value)
                }
              >
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}

            {/* ===== TEXT ===== */}
            {filter.type === 'text' && (
              <input
                id={filter.key}
                type="text"
                className="
                  w-full h-9
                  rounded-md
                  bg-white border border-slate-300
                  px-2 text-xs text-slate-800
                  placeholder-slate-400
                  focus:outline-none focus:ring-1 focus:ring-indigo-500
                "
                placeholder={filter.placeholder}
                value={filter.value}
                onChange={(e) =>
                  handleFilterChange(filter.key, e.target.value)
                }
              />
            )}

            {/* ===== DATE ===== */}
            {filter.type === 'date' && (
              <input
                id={filter.key}
                type="date"
                className="
                  w-full h-9
                  rounded-md
                  bg-white border border-slate-300
                  px-2 text-xs text-slate-800
                  focus:outline-none focus:ring-1 focus:ring-indigo-500
                "
                value={filter.value}
                onChange={(e) =>
                  handleFilterChange(filter.key, e.target.value)
                }
              />
            )}

            {/* ===== DATE RANGE ===== */}
            {filter.type === 'dateRange' && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  className="
                    w-full h-9
                    rounded-md
                    bg-white border border-slate-300
                    px-2 text-xs text-slate-800
                    focus:outline-none focus:ring-1 focus:ring-indigo-500
                  "
                  value={filter.value.from || ''}
                  onChange={(e) => {
                    handleFilterChange(filter.key, {
                      ...filter.value,
                      from: e.target.value,
                    });
                  }}
                />

                <span className="text-xs text-slate-400">to</span>

                <input
                  type="date"
                  className="
                    w-full h-9
                    rounded-md
                    bg-white border border-slate-300
                    px-2 text-xs text-slate-800
                    focus:outline-none focus:ring-1 focus:ring-indigo-500
                  "
                  value={filter.value.to || ''}
                  onChange={(e) => {
                    handleFilterChange(filter.key, {
                      ...filter.value,
                      to: e.target.value,
                    });
                  }}
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
