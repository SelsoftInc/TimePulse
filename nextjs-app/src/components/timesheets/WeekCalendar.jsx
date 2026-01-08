'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '@/contexts/ToastContext';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

/**
 * WeekCalendar Component
 * 
 * A week-range calendar view for selecting timesheet weeks with visual status indicators:
 * - Green: Approved timesheets (not selectable)
 * - Red: Rejected timesheets (selectable)
 * - Blue: Submitted timesheets (not selectable)
 * - Yellow: Invoice raised (not selectable)
 * - Gray: No timesheet (selectable)
 */
const WeekCalendar = ({ 
  selectedWeek, 
  onWeekSelect, 
  employeeId, 
  tenantId,
  availableWeeks = [],
  onClose 
}) => {
  const { toast } = useToast();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [weekStatuses, setWeekStatuses] = useState({});
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [hoveredDate, setHoveredDate] = useState(null);

  // Fetch timesheet statuses for all weeks
  useEffect(() => {
    const fetchWeekStatuses = async () => {
      if (!employeeId || !tenantId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('📅 Fetching timesheet statuses for employee:', employeeId);

        // Fetch all timesheets for the employee
        const response = await axios.get(`${API_BASE}/api/timesheets/employee/${employeeId}/all`, {
          params: { tenantId }
        });

        if (response.data.success && response.data.timesheets) {
          const statuses = {};
          
          response.data.timesheets.forEach(ts => {
            // Parse dates as local dates to avoid timezone issues
            const weekStartStr = ts.weekStart.split('T')[0]; // Get YYYY-MM-DD
            const weekEndStr = ts.weekEnd.split('T')[0];
            const [startYear, startMonth, startDay] = weekStartStr.split('-').map(Number);
            const [endYear, endMonth, endDay] = weekEndStr.split('-').map(Number);
            
            const weekStart = new Date(startYear, startMonth - 1, startDay);
            const weekEnd = new Date(endYear, endMonth - 1, endDay);
            weekStart.setHours(0, 0, 0, 0);
            weekEnd.setHours(0, 0, 0, 0);
            
            const weekKey = `${weekStartStr}_${weekEndStr}`;
            
            // Parse status from backend format
            let statusValue = ts.status;
            if (typeof ts.status === 'object' && ts.status.label) {
              statusValue = ts.status.label.toLowerCase().replace(' ', '_');
            } else if (typeof ts.status === 'string') {
              statusValue = ts.status.toLowerCase();
            }
            
            statuses[weekKey] = {
              status: statusValue,
              weekStart: ts.weekStart,
              weekEnd: ts.weekEnd,
              weekRange: ts.week || `${formatDate(weekStart)} To ${formatDate(weekEnd)}`,
              readonly: ts.invoiceRaised || false
            };
            
            console.log(`📊 Timesheet: ${weekKey} - Status: ${statusValue}`);
          });

          console.log('✅ Week statuses loaded:', statuses);
          setWeekStatuses(statuses);
        }
      } catch (error) {
        console.error('❌ Error fetching week statuses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeekStatuses();
  }, [employeeId, tenantId]);

  const formatDate = (date) => {
    // Use local date methods to avoid timezone conversion issues
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0'); // MM format
    const day = String(d.getDate()).padStart(2, '0');        // DD format
    const year = d.getFullYear();                            // YYYY format
    return `${month}-${day}-${year}`; // MM-DD-YYYY format
  };

  // Get the start of the week (Sunday)
  const getWeekStart = (date) => {
    const weekStart = new Date(date);
    const dayOfWeek = date.getDay();
    weekStart.setDate(weekStart.getDate() - dayOfWeek);
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  };

  // Get calendar days for the month view
  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Get first day of month
    const firstDay = new Date(year, month, 1);
    // Get last day of month
    const lastDay = new Date(year, month + 1, 0);
    
    // Get the Sunday before or on the first day
    const calendarStart = getWeekStart(firstDay);
    
    // Generate all days for the calendar (6 weeks)
    const days = [];
    let currentDay = new Date(calendarStart);
    
    for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
      days.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    return days;
  };

  // Get week number for a date
  const getWeekNumber = (date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  // Get week info for a date
  const getWeekInfo = (date) => {
    const weekStart = getWeekStart(date);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    return {
      weekStart,
      weekEnd,
      weekKey: `${weekStart.toISOString().split('T')[0]}_${weekEnd.toISOString().split('T')[0]}`,
      weekRange: `${formatDate(weekStart)} To ${formatDate(weekEnd)}`,
      weekNumber: getWeekNumber(weekStart)
    };
  };

  // Check if a date is within an approved/submitted timesheet range
  const getDateStatus = (date) => {
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    for (const [weekKey, status] of Object.entries(weekStatuses)) {
      const [startStr, endStr] = weekKey.split('_');
      const [startYear, startMonth, startDay] = startStr.split('-').map(Number);
      const [endYear, endMonth, endDay] = endStr.split('-').map(Number);
      
      const rangeStart = new Date(startYear, startMonth - 1, startDay);
      const rangeEnd = new Date(endYear, endMonth - 1, endDay);
      rangeStart.setHours(0, 0, 0, 0);
      rangeEnd.setHours(0, 0, 0, 0);
      
      if (checkDate >= rangeStart && checkDate <= rangeEnd) {
        return status;
      }
    }
    return null;
  };

  // Get background color for a day
  const getDayBackgroundColor = (date, isCurrentMonth, isToday, isInRange, isRangeStart, isRangeEnd) => {
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Future dates - gray out
    if (checkDate > today) {
      return 'bg-slate-100 text-slate-400';
    }
    
    const status = getDateStatus(date);
    
    // If in selected range
    if (isInRange) {
      if (isRangeStart || isRangeEnd) {
        return 'bg-indigo-600 text-white';
      }
      return 'bg-indigo-100';
    }
    
    // If has status
    if (status) {
      if (status.readonly) {
        return 'bg-yellow-200 border-2 border-yellow-500'; // Strong yellow for invoice raised
      }
      
      switch (status.status) {
        case 'approved':
          return 'bg-green-200 border-2 border-green-500'; // Strong green for approved
        case 'rejected':
          return 'bg-red-100';
        case 'submitted':
          return 'bg-blue-200 border-2 border-blue-500'; // Strong blue for submitted
        default:
          return isCurrentMonth ? 'bg-white' : 'bg-slate-50';
      }
    }
    
    // Default
    return isCurrentMonth ? 'bg-white' : 'bg-slate-50';
  };

  // Check if a date is selectable
  const isDateSelectable = (date) => {
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Can't select future dates
    if (checkDate > today) {
      return false;
    }
    
    const status = getDateStatus(date);
    
    // Can't select if invoice raised
    if (status && status.readonly) {
      return false;
    }
    
    // Can't select if approved or submitted
    if (status && (status.status === 'approved' || status.status === 'submitted')) {
      return false;
    }
    
    // Can select if no timesheet, rejected, or draft
    return true;
  };

  // Handle date click
  const handleDateClick = (date) => {
    if (!isDateSelectable(date)) {
      console.log('⚠️ Date not selectable:', date);
      return;
    }
    
    if (!startDate) {
      // First click - set start date
      setStartDate(date);
      setEndDate(null);
      console.log('📅 Start date selected:', date);
    } else if (!endDate) {
      // Second click - set end date and validate 7-day range
      // Normalize both dates to midnight for accurate comparison
      const clickDate = new Date(date);
      clickDate.setHours(0, 0, 0, 0);
      const startNormalized = new Date(startDate);
      startNormalized.setHours(0, 0, 0, 0);
      
      const diffTime = Math.abs(clickDate - startNormalized);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 6) {
        // More than 7 days - reset without showing toast
        setStartDate(date);
        setEndDate(null);
        console.log('⚠️ Range too large, starting over. New start:', date);
        return;
      }
      
      // Determine which is start and which is end
      const rangeStart = clickDate < startNormalized ? clickDate : startNormalized;
      const rangeEnd = clickDate > startNormalized ? clickDate : startNormalized;
      
      // Check if all dates in range are selectable
      let currentDate = new Date(rangeStart);
      const endCheck = new Date(rangeEnd);
      let allSelectable = true;
      
      while (currentDate <= endCheck) {
        if (!isDateSelectable(currentDate)) {
          allSelectable = false;
          break;
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      if (!allSelectable) {
        // Reset without showing toast
        console.log('⚠️ Some dates in range are not selectable');
        setStartDate(null);
        setEndDate(null);
        return;
      }
      
      // Calculate to ensure exactly 7 days (inclusive)
      const finalEnd = new Date(rangeStart);
      finalEnd.setDate(finalEnd.getDate() + 6);
      
      setStartDate(rangeStart);
      setEndDate(finalEnd);
      
      // Format and call callback
      const weekRange = `${formatDate(rangeStart)} To ${formatDate(finalEnd)}`;
      console.log('✅ Week range selected:', weekRange);
      console.log('📅 Start date (local):', rangeStart.toString());
      console.log('📅 Start date object:', rangeStart);
      console.log('📅 End date (local):', finalEnd.toString());
      console.log('📅 End date object:', finalEnd);
      
      // Call the callback without triggering page refresh
      if (onWeekSelect) {
        onWeekSelect(weekRange);
      }
      
      // Close calendar after selection
      if (onClose) {
        setTimeout(() => onClose(), 300);
      }
    } else {
      // Already have a range - reset and start over
      setStartDate(date);
      setEndDate(null);
      console.log('🔄 Resetting selection. New start:', date);
    }
  };

  // Check if date is in selected range
  const isDateInRange = (date) => {
    if (!startDate) return false;
    if (!endDate) return date.toDateString() === startDate.toDateString();
    
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    
    return checkDate >= start && checkDate <= end;
  };
  
  // Check if date is range start
  const isRangeStart = (date) => {
    if (!startDate) return false;
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    return checkDate.getTime() === start.getTime();
  };
  
  // Check if date is range end
  const isRangeEnd = (date) => {
    if (!endDate) return false;
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    return checkDate.getTime() === end.getTime();
  };

  // Navigate months
  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  const calendarDays = getCalendarDays();
  const monthName = currentMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Group days by week for rendering
  const weeks = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  return (
    <div className="week-calendar rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Header with Month Navigation */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={previousMonth}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors shadow-md"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="text-xl font-bold text-slate-900">{monthName}</h3>
        <button
          onClick={nextMonth}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors shadow-md"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600"></div>
        </div>
      )}

      {/* Calendar Grid */}
      {!loading && (
        <div className="space-y-4">
          {/* Day Headers */}
          <div className="grid grid-cols-8 gap-2">
            <div className="text-center text-xs font-semibold text-slate-600">Week</div>
            <div className="text-center text-xs font-semibold text-slate-600">Sun</div>
            <div className="text-center text-xs font-semibold text-slate-600">Mon</div>
            <div className="text-center text-xs font-semibold text-slate-600">Tue</div>
            <div className="text-center text-xs font-semibold text-slate-600">Wed</div>
            <div className="text-center text-xs font-semibold text-slate-600">Thu</div>
            <div className="text-center text-xs font-semibold text-slate-600">Fri</div>
            <div className="text-center text-xs font-semibold text-slate-600">Sat</div>
          </div>

          {/* Calendar Weeks */}
          {weeks.map((week, weekIndex) => {
            const weekInfo = getWeekInfo(week[0]);
            
            return (
              <div
                key={weekIndex}
                className="grid grid-cols-8 gap-2"
              >
                {/* Week Number */}
                <div className="flex items-center justify-center text-xs font-medium text-slate-500">
                  {weekInfo.weekNumber}
                </div>
                
                {/* Days of the week */}
                {week.map((day, dayIndex) => {
                  const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                  const isToday = day.getTime() === today.getTime();
                  const inRange = isDateInRange(day);
                  const rangeStart = isRangeStart(day);
                  const rangeEnd = isRangeEnd(day);
                  const selectable = isDateSelectable(day);
                  const bgColor = getDayBackgroundColor(day, isCurrentMonth, isToday, inRange, rangeStart, rangeEnd);
                  const status = getDateStatus(day);
                  
                  return (
                    <button
                      key={dayIndex}
                      onClick={() => handleDateClick(day)}
                      disabled={!selectable}
                      className={`
                        relative flex h-12 items-center justify-center rounded-lg text-sm font-medium transition-all
                        ${bgColor}
                        ${isCurrentMonth && !inRange ? 'text-slate-900' : ''}
                        ${!isCurrentMonth && !inRange ? 'text-slate-400' : ''}
                        ${isToday && !inRange ? 'ring-2 ring-rose-500 ring-offset-1' : ''}
                        ${!selectable ? 'cursor-not-allowed opacity-60' : 'hover:shadow-lg cursor-pointer hover:scale-105'}
                      `}
                    >
                      {day.getDate()}
                      {isToday && !inRange && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[8px] font-bold text-white">
                          ×
                        </span>
                      )}
                      {status && status.status === 'approved' && (
                        <span className="absolute top-0 right-0 flex h-3 w-3 items-center justify-center rounded-full bg-green-600 text-[8px] font-bold text-white">
                          ✓
                        </span>
                      )}
                      {status && status.status === 'submitted' && (
                        <span className="absolute top-0 right-0 flex h-3 w-3 items-center justify-center rounded-full bg-blue-600 text-[8px] font-bold text-white">
                          •
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* Selection Instructions */}
      {!startDate && (
        <div className="mt-6 rounded-lg bg-blue-50 border border-blue-200 p-3 text-center">
          <p className="text-sm font-medium text-blue-900">Click a date to start selecting your 7-day period</p>
        </div>
      )}
      {startDate && !endDate && (
        <div className="mt-6 rounded-lg bg-indigo-50 border border-indigo-200 p-3 text-center">
          <p className="text-sm font-medium text-indigo-900">Click another date within 7 days to complete your selection</p>
          <p className="text-xs text-indigo-700 mt-1">Started: {formatDate(startDate)}</p>
        </div>
      )}
      {startDate && endDate && (
        <div className="mt-6 rounded-lg bg-green-50 border border-green-200 p-3 text-center">
          <p className="text-sm font-semibold text-green-900">
            {formatDate(startDate)} To {formatDate(endDate)}
          </p>
          <p className="text-xs text-green-700 mt-1">7-day period selected</p>
        </div>
      )}

      {/* Status Legend */}
      <div className="mt-6 space-y-3 border-t border-slate-200 pt-4">
        <h5 className="text-xs font-semibold text-slate-700">Status Legend</h5>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-green-200 border-2 border-green-500"></div>
            <span className="text-slate-700 font-medium">Approved (Not Selectable)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-blue-200 border-2 border-blue-500"></div>
            <span className="text-slate-700 font-medium">Submitted (Not Selectable)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-yellow-200 border-2 border-yellow-500"></div>
            <span className="text-slate-700 font-medium">Invoice Raised (Not Selectable)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-red-100 border border-red-300"></div>
            <span className="text-slate-700">Rejected (Selectable)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-slate-100 border border-slate-300"></div>
            <span className="text-slate-700 font-medium">Future Dates (Not Selectable)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-indigo-600"></div>
            <span className="text-slate-700">Selected Range</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-4 w-4 items-center justify-center rounded border-2 border-rose-500 text-[8px] font-bold text-rose-500">×</span>
            <span className="text-slate-700">Today</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeekCalendar;
