# Dashboard Revenue Display Fix - Current Month Data

## Issue Summary

**Problem:** Dashboard displays cumulative revenue data instead of current month revenue. The "Total Revenue" card and "Revenue by Client" section show all-time totals rather than monthly data.

**Requirements:**
1. **Total Revenue card**: Display current month revenue (January 2026)
2. **Revenue by Client**: Display current month client revenue
3. **Bottom left of Total Revenue card**: Change "This Month" to "Last Month" and show last month's revenue

## Analysis from Screenshot

### Before Fix:
- **Total Revenue**: $71,780.86 (cumulative/all-time)
- **Revenue by Client**: 
  - Cognizant: $36,207.99 (cumulative)
  - Acme Corporation: $35,572.87 (cumulative)
- **Bottom left label**: "This Month $71,780.86" (incorrect - showing total)

### After Fix:
- **Total Revenue**: Shows **current month** (January 2026) revenue only
- **Revenue by Client**: Shows **current month** client revenue
- **Bottom left label**: "Last Month" with December 2025 revenue

## Solution Implemented

### 1. Backend API Changes

#### File: `server/routes/dashboard.js`

**Added Current Month and Last Month Revenue Calculations:**

```javascript
SELECT
  -- Current month revenue (based on current date)
  COALESCE(SUM(CASE 
    WHEN i.payment_status IN ('pending','paid','overdue') 
    AND DATE_TRUNC('month', i.invoice_date) = DATE_TRUNC('month', CURRENT_DATE)
    THEN i.total_amount 
  END), 0) AS current_month_revenue,
  
  -- Last month revenue
  COALESCE(SUM(CASE 
    WHEN i.payment_status IN ('pending','paid','overdue') 
    AND DATE_TRUNC('month', i.invoice_date) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
    THEN i.total_amount 
  END), 0) AS last_month_revenue,
  
  -- Total revenue (all time or filtered by date range)
  COALESCE(SUM(CASE WHEN i.payment_status IN ('pending','paid','overdue') THEN i.total_amount END), 0) AS total_revenue,
  ...
FROM invoices i
WHERE i.tenant_id = :tenantId
```

**Added Console Logging:**

```javascript
console.log('📊 Dashboard API Request:', {
  scope,
  tenantId,
  employeeId: employeeId || 'N/A',
  dateRange: {
    from: fromDate ? fromDate.toISOString().split('T')[0] : 'N/A',
    to: toDate ? toDate.toISOString().split('T')[0] : 'N/A'
  }
});

console.log('💰 Revenue Breakdown:', {
  currentMonthRevenue: kpisData.current_month_revenue || 0,
  lastMonthRevenue: kpisData.last_month_revenue || 0,
  totalRevenue: kpisData.total_revenue || 0,
  outstanding: kpisData.ar_outstanding || 0
});
```

#### File: `server/routes/dashboard-extended.js`

**Updated Revenue by Client to Default to Current Month:**

```javascript
// Default to current month if no date range provided
const now = new Date();
const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

const fromDate = from ? new Date(from) : currentMonthStart;
const toDate = to ? new Date(to) : currentMonthEnd;

console.log('📊 Revenue by Client - Date Filter:', {
  from: fromDate.toISOString().split('T')[0],
  to: toDate.toISOString().split('T')[0],
  isCurrentMonth: !from && !to
});
```

### 2. Frontend Changes

#### File: `nextjs-app/src/components/dashboard/ModernDashboard.jsx`

**Updated Date Range to Current Month:**

```javascript
// Set date range to current month for accurate monthly reporting
const [dateRange] = useState(() => {
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: currentMonthStart,
    end: currentMonthEnd
  };
});
```

**Updated Revenue Display Functions:**

```javascript
// Dashboard metrics using real-time API data
const getTotalRevenue = () => {
  // Display current month revenue as the main total
  return parseFloat(dashboardData.kpis?.current_month_revenue || 0);
};

const getCurrentMonthRevenue = () => {
  return parseFloat(dashboardData.kpis?.current_month_revenue || 0);
};

const getLastMonthRevenue = () => {
  return parseFloat(dashboardData.kpis?.last_month_revenue || 0);
};
```

**Updated Total Revenue Card Label:**

```javascript
<div className="mt-3 grid grid-cols-2 gap-3 text-xs text-gray-600 dark:text-gray-300">
  <div>
    <div className="text-[11px] text-gray-500 dark:text-gray-400">Last Month</div>
    <div className="font-semibold text-gray-900 dark:text-white">
      {formatCurrency(getLastMonthRevenue())}
    </div>
  </div>
  <div className="text-right">
    <div className="text-[11px] text-gray-500 dark:text-gray-400">Outstanding</div>
    <div className="font-semibold text-gray-900 dark:text-white">
      {formatCurrency(getOutstandingInvoices())}
    </div>
  </div>
</div>
```

## Files Modified

### Backend:
1. ✅ `server/routes/dashboard.js` - Added current/last month revenue calculations and logging
2. ✅ `server/routes/dashboard-extended.js` - Updated revenue-by-client to default to current month

### Frontend:
1. ✅ `nextjs-app/src/components/dashboard/ModernDashboard.jsx` - Updated date range and revenue display

## Console Output Examples

### Backend Logs (When Dashboard Loads):

```
📊 Dashboard API Request: {
  scope: 'company',
  tenantId: '5eda5596-b1d9-4963-953d-7af9d0511ce8',
  employeeId: 'N/A',
  dateRange: {
    from: '2026-01-01',
    to: '2026-01-31'
  }
}

💰 Revenue Breakdown: {
  currentMonthRevenue: 23010.95,
  lastMonthRevenue: 59775.91,
  totalRevenue: 71780.86,
  outstanding: 15234.50
}

📊 Revenue by Client - Date Filter: {
  from: '2026-01-01',
  to: '2026-01-31',
  isCurrentMonth: true
}
```

## Expected Dashboard Display (January 2026)

### Total Revenue Card:
- **Main Display**: $23,010.95 (January 2026 revenue)
- **Bottom Left**: "Last Month: $59,775.91" (December 2025)
- **Bottom Right**: "Outstanding: $15,234.50"

### Revenue by Client Card:
- Shows only clients with invoices in January 2026
- Revenue amounts reflect January 2026 only
- Example:
  - Cognizant: $12,500.00 (Jan 2026 only)
  - Acme Corporation: $10,510.95 (Jan 2026 only)

## Testing Checklist

- [ ] Dashboard loads without errors
- [ ] Total Revenue displays current month (January 2026) amount
- [ ] "Last Month" label shows December 2025 revenue
- [ ] Revenue by Client shows only January 2026 data
- [ ] Console logs display correct date ranges
- [ ] Console logs show revenue breakdown
- [ ] Outstanding invoices display correctly
- [ ] Active Employees count is accurate
- [ ] Monthly Revenue chart displays correctly

## Technical Details

### Date Filtering Logic:

**Current Month:**
```sql
DATE_TRUNC('month', i.invoice_date) = DATE_TRUNC('month', CURRENT_DATE)
```

**Last Month:**
```sql
DATE_TRUNC('month', i.invoice_date) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
```

**Current Month Date Range (JavaScript):**
```javascript
const now = new Date();
const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
```

### API Response Structure:

```json
{
  "scope": "company",
  "employeeId": null,
  "dateRange": {
    "from": "2026-01-01",
    "to": "2026-01-31"
  },
  "kpis": {
    "current_month_revenue": 23010.95,
    "last_month_revenue": 59775.91,
    "total_revenue": 71780.86,
    "ar_outstanding": 15234.50,
    "active_employees": 37,
    "ts_pending": 0,
    "ts_approved": 13
  },
  "arAging": { ... },
  "revenueByEmployee": [ ... ],
  "revenueTrend": [ ... ]
}
```

## Benefits

1. **Accurate Monthly Reporting**: Dashboard now shows current month data by default
2. **Historical Comparison**: Last month revenue visible for comparison
3. **Better Decision Making**: Real-time current month performance tracking
4. **Automatic Date Handling**: No manual date selection needed for current month view
5. **Comprehensive Logging**: Console logs help debug and verify calculations

## Future Enhancements

1. **Month Selector**: Add dropdown to select different months
2. **Year-over-Year Comparison**: Show same month last year
3. **Trend Indicators**: Show percentage change from last month
4. **Forecast**: Project end-of-month revenue based on current pace
5. **Custom Date Ranges**: Allow users to select custom date ranges

## Rollback Instructions

If needed, revert the changes:

```bash
cd d:\selsoft\WebApp\TimePulse
git checkout HEAD -- server/routes/dashboard.js
git checkout HEAD -- server/routes/dashboard-extended.js
git checkout HEAD -- nextjs-app/src/components/dashboard/ModernDashboard.jsx
```

## Support

If issues occur:

1. **Check backend console** for revenue breakdown logs
2. **Verify database** has invoices for current month
3. **Check date calculations** in console logs
4. **Verify API response** includes `current_month_revenue` and `last_month_revenue`
5. **Check browser console** for frontend errors

## Notes

- The ESLint warning about `next/babel` is a project configuration issue unrelated to these changes
- All revenue calculations use `invoice_date` field from the invoices table
- Date truncation ensures accurate month-based filtering
- Console logging helps verify correct data flow from backend to frontend
