# TimePulse Performance Optimization Guide

## 🚀 Performance Issues Fixed

### 1. **Slow Initial Load & Navigation**
**Problem**: Application takes several seconds to load and navigate between pages.

**Solutions Implemented**:
- ✅ Enabled SWC minification in `next.config.js`
- ✅ Optimized on-demand entries buffer (60s cache, 5 page buffer)
- ✅ Added CSS optimization
- ✅ Enabled package import optimization
- ✅ Added preconnect to API server in layout

### 2. **UI Alignment Issues After Refresh**
**Problem**: Tailwind CSS classes not applying correctly until refresh.

**Root Cause**: Hydration mismatch between server and client rendering.

**Solutions**:
- ✅ Added `suppressHydrationWarning` to html and body tags
- ✅ Use `useEffect` for client-only rendering
- ✅ Avoid conditional rendering based on `window` or `localStorage` during initial render

### 3. **Slow API Responses**
**Problem**: API calls taking too long, causing UI delays.

**Solutions**:
- ✅ Created `cachedFetch` utility for API response caching
- ✅ Added debounce/throttle utilities for search and filters
- ✅ Implemented in-memory cache with TTL

---

## 📦 New Files Created

### 1. `/src/lib/performance.js`
Performance utilities including:
- `debounce()` - Limit API calls
- `throttle()` - Limit execution frequency
- `cachedFetch()` - Cache API responses
- `apiCache` - Simple in-memory cache
- `shallowEqual()` - Optimize re-renders

### 2. `/src/components/common/LoadingSpinner.jsx`
Loading components:
- `LoadingSpinner` - Customizable spinner
- `TableSkeleton` - Skeleton for tables
- `CardSkeleton` - Skeleton for cards

---

## 🔧 Implementation Guide

### Fix Hydration Issues

**Before (Causes hydration mismatch):**
```jsx
function Component() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
  
  return <div>{user?.name}</div>; // ❌ Hydration mismatch
}
```

**After (Fixed):**
```jsx
function Component() {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    setUser(JSON.parse(localStorage.getItem('user')));
  }, []);
  
  if (!user) return <LoadingSpinner />;
  
  return <div>{user.name}</div>; // ✅ No hydration mismatch
}
```

### Use Cached API Calls

**Before:**
```jsx
const response = await fetch(`${API_BASE}/api/invoices?tenantId=${tenantId}`);
const data = await response.json();
```

**After:**
```jsx
import { cachedFetch } from '@/lib/performance';

const data = await cachedFetch(
  `${API_BASE}/api/invoices?tenantId=${tenantId}`,
  { headers: { 'Authorization': `Bearer ${token}` } },
  60000 // Cache for 1 minute
);
```

### Debounce Search Inputs

**Before:**
```jsx
<input onChange={(e) => fetchResults(e.target.value)} />
```

**After:**
```jsx
import { debounce } from '@/lib/performance';

const debouncedSearch = useMemo(
  () => debounce((value) => fetchResults(value), 300),
  []
);

<input onChange={(e) => debouncedSearch(e.target.value)} />
```

### Use Loading States

**Before:**
```jsx
{data.map(item => <Item key={item.id} {...item} />)}
```

**After:**
```jsx
import LoadingSpinner, { TableSkeleton } from '@/components/common/LoadingSpinner';

{loading ? (
  <TableSkeleton rows={5} columns={6} />
) : (
  data.map(item => <Item key={item.id} {...item} />)
)}
```

### Dynamic Imports for Heavy Components

**Before:**
```jsx
import InvoicePDFPreviewModal from '@/components/common/InvoicePDFPreviewModal';
```

**After:**
```jsx
import dynamic from 'next/dynamic';

const InvoicePDFPreviewModal = dynamic(
  () => import('@/components/common/InvoicePDFPreviewModal'),
  { 
    loading: () => <LoadingSpinner fullScreen text="Loading PDF Preview..." />,
    ssr: false // Disable server-side rendering for client-only components
  }
);
```

### Optimize useEffect Dependencies

**Before (Causes infinite re-renders):**
```jsx
useEffect(() => {
  fetchData();
}, [fetchData]); // ❌ fetchData recreated every render
```

**After:**
```jsx
const fetchData = useCallback(async () => {
  // fetch logic
}, [dependency1, dependency2]); // ✅ Memoized

useEffect(() => {
  fetchData();
}, [fetchData]);
```

---

## 🎯 Priority Optimizations

### High Priority (Implement First)

1. **Fix Hydration Issues in All Components**
   - Add `suppressHydrationWarning` where needed
   - Move `localStorage` access to `useEffect`
   - Use loading states during hydration

2. **Add Loading Skeletons**
   - Replace loading spinners with skeletons
   - Improves perceived performance
   - Better UX

3. **Cache Frequently Accessed Data**
   - User info
   - Client list
   - Employee list
   - Invoice list (with short TTL)

### Medium Priority

4. **Debounce Search & Filters**
   - Search inputs
   - Filter dropdowns
   - Date range selectors

5. **Dynamic Imports for Modals**
   - PDF preview modal
   - Invoice generation modal
   - Large report components

6. **Optimize Images**
   - Use Next.js Image component
   - Add lazy loading
   - Compress images

### Low Priority

7. **Code Splitting**
   - Split large components
   - Lazy load routes
   - Tree shake unused code

8. **Service Worker**
   - Cache static assets
   - Offline support
   - Background sync

---

## 📊 Performance Metrics to Monitor

### Before Optimization
- Initial load: ~8-10 seconds
- Navigation: ~2-3 seconds
- API calls: ~1-2 seconds each
- Hydration mismatches: Multiple warnings

### Target After Optimization
- Initial load: <3 seconds
- Navigation: <500ms
- API calls: <500ms (with cache)
- Hydration mismatches: 0

---

## 🔍 Common Issues & Solutions

### Issue: "Hydration failed" Error
**Solution**: Ensure server and client render the same content initially.
```jsx
// Use suppressHydrationWarning on elements that differ
<div suppressHydrationWarning>{clientOnlyValue}</div>
```

### Issue: Slow Table Rendering
**Solution**: Implement pagination and virtual scrolling.
```jsx
// Already implemented pagination in Reports & Analytics
// Use 10-20 items per page maximum
```

### Issue: Multiple API Calls on Mount
**Solution**: Use `useCallback` and proper dependencies.
```jsx
const fetchData = useCallback(async () => {
  // ...
}, []); // Empty deps if no external dependencies
```

### Issue: CSS Not Loading
**Solution**: Ensure Tailwind classes are not dynamically generated.
```jsx
// ❌ Bad - Tailwind won't detect
const color = `text-${dynamicColor}-500`;

// ✅ Good - Use complete class names
const colorClass = dynamicColor === 'blue' ? 'text-blue-500' : 'text-red-500';
```

---

## 🚀 Quick Wins (Implement Today)

1. **Add `suppressHydrationWarning` to layout.jsx** ✅ Done
2. **Enable SWC minification in next.config.js** ✅ Done
3. **Add preconnect to API server** ✅ Done
4. **Use LoadingSpinner in all components**
5. **Cache user info and common data**
6. **Debounce all search inputs**

---

## 📝 Next Steps

1. **Audit All Components**
   - Find hydration issues
   - Add loading states
   - Implement caching

2. **Test Performance**
   - Use Chrome DevTools Performance tab
   - Monitor Network tab
   - Check React DevTools Profiler

3. **Measure Improvements**
   - Record before/after metrics
   - User feedback
   - Error monitoring

---

## 💡 Best Practices

### DO:
- ✅ Use `useCallback` for functions passed as props
- ✅ Use `useMemo` for expensive calculations
- ✅ Implement pagination for large lists
- ✅ Add loading states everywhere
- ✅ Cache API responses
- ✅ Use dynamic imports for heavy components
- ✅ Optimize images with Next.js Image

### DON'T:
- ❌ Access `localStorage` during initial render
- ❌ Use `window` object without checking
- ❌ Create functions inside render
- ❌ Fetch data without caching
- ❌ Render large lists without pagination
- ❌ Use inline styles for Tailwind classes
- ❌ Import heavy libraries globally

---

## 🔗 Resources

- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [React Performance](https://react.dev/learn/render-and-commit)
- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

---

**Last Updated**: December 2025
**Version**: 1.0.0
