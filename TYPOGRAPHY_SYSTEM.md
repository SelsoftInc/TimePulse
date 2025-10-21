# TimePulse Typography System

## Overview

This document outlines the comprehensive typography system implemented in TimePulse to ensure consistent, professional, and modern font usage across the entire application, similar to leading SaaS products like Notion, Linear, and Vercel.

## Font Family

- **Primary Font**: Inter (Google Fonts)
- **Fallback Stack**: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif
- **Monospace Font**: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Courier New', monospace

## Typography Scale

### Font Sizes

- `--font-size-xs`: 0.75rem (12px)
- `--font-size-sm`: 0.875rem (14px)
- `--font-size-base`: 1rem (16px)
- `--font-size-lg`: 1.125rem (18px)
- `--font-size-xl`: 1.25rem (20px)
- `--font-size-2xl`: 1.5rem (24px)
- `--font-size-3xl`: 1.875rem (30px)
- `--font-size-4xl`: 2.25rem (36px)
- `--font-size-5xl`: 3rem (48px)

### Font Weights

- `--font-weight-light`: 300
- `--font-weight-regular`: 400
- `--font-weight-medium`: 500
- `--font-weight-semibold`: 600
- `--font-weight-bold`: 700

### Line Heights

- `--line-height-tight`: 1.25
- `--line-height-snug`: 1.375
- `--line-height-normal`: 1.5
- `--line-height-relaxed`: 1.625
- `--line-height-loose`: 2

### Letter Spacing

- `--letter-spacing-tighter`: -0.05em
- `--letter-spacing-tight`: -0.025em
- `--letter-spacing-normal`: 0
- `--letter-spacing-wide`: 0.025em
- `--letter-spacing-wider`: 0.05em
- `--letter-spacing-widest`: 0.1em

## Color Palette

### Text Colors

- `--color-text-primary`: #1a1a1a (Main text)
- `--color-text-secondary`: #6b7280 (Secondary text)
- `--color-text-tertiary`: #9ca3af (Tertiary text)
- `--color-text-quaternary`: #d1d5db (Quaternary text)
- `--color-text-inverse`: #ffffff (Inverse text)

### Background Colors

- `--color-bg-primary`: #ffffff (Main background)
- `--color-bg-secondary`: #f9fafb (Secondary background)
- `--color-bg-tertiary`: #f3f4f6 (Tertiary background)
- `--color-bg-quaternary`: #e5e7eb (Quaternary background)

### Accent Colors

- `--color-accent-primary`: #3b82f6 (Primary accent)
- `--color-accent-secondary`: #1d4ed8 (Secondary accent)
- `--color-accent-tertiary`: #dbeafe (Tertiary accent)

## Component Typography Classes

### Headings

```css
h1,
.h1 {
  /* 36px, bold, tight line-height */
}
h2,
.h2 {
  /* 30px, semibold, snug line-height */
}
h3,
.h3 {
  /* 24px, semibold, snug line-height */
}
h4,
.h4 {
  /* 20px, medium, normal line-height */
}
h5,
.h5 {
  /* 18px, medium, normal line-height */
}
h6,
.h6 {
  /* 16px, medium, normal line-height */
}
```

### Text Utilities

```css
.text-xs {
  font-size: var(--font-size-xs);
}
.text-sm {
  font-size: var(--font-size-sm);
}
.text-base {
  font-size: var(--font-size-base);
}
.text-lg {
  font-size: var(--font-size-lg);
}
.text-xl {
  font-size: var(--font-size-xl);
}
.text-2xl {
  font-size: var(--font-size-2xl);
}
.text-3xl {
  font-size: var(--font-size-3xl);
}
.text-4xl {
  font-size: var(--font-size-4xl);
}
.text-5xl {
  font-size: var(--font-size-5xl);
}
```

### Font Weight Utilities

```css
.font-light {
  font-weight: var(--font-weight-light);
}
.font-regular {
  font-weight: var(--font-weight-regular);
}
.font-medium {
  font-weight: var(--font-weight-medium);
}
.font-semibold {
  font-weight: var(--font-weight-semibold);
}
.font-bold {
  font-weight: var(--font-weight-bold);
}
```

### Color Utilities

```css
.text-primary {
  color: var(--color-text-primary);
}
.text-secondary {
  color: var(--color-text-secondary);
}
.text-tertiary {
  color: var(--color-text-tertiary);
}
.text-quaternary {
  color: var(--color-text-quaternary);
}
.text-inverse {
  color: var(--color-text-inverse);
}
```

### Line Height Utilities

```css
.leading-tight {
  line-height: var(--line-height-tight);
}
.leading-snug {
  line-height: var(--line-height-snug);
}
.leading-normal {
  line-height: var(--line-height-normal);
}
.leading-relaxed {
  line-height: var(--line-height-relaxed);
}
.leading-loose {
  line-height: var(--line-height-loose);
}
```

## Component-Specific Classes

### Table Typography

```css
.table-header {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
  letter-spacing: var(--letter-spacing-wide);
  color: var(--color-text-secondary);
  text-transform: uppercase;
}

.table-cell {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-regular);
  line-height: var(--line-height-normal);
  color: var(--color-text-primary);
}
```

### Button Typography

```css
.btn-text {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-tight);
  letter-spacing: var(--letter-spacing-wide);
}
```

### Form Typography

```css
.form-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-tight);
  color: var(--color-text-primary);
}

.form-control {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-regular);
  line-height: var(--line-height-normal);
  color: var(--color-text-primary);
}
```

### Badge Typography

```css
.badge {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-tight);
  letter-spacing: var(--letter-spacing-wide);
}
```

## Implementation

### Files Modified

1. **`/frontend/public/index.html`** - Added Google Fonts Inter import
2. **`/frontend/src/index.css`** - Created comprehensive typography system
3. **`/frontend/src/typography-override.css`** - Global typography overrides
4. **`/frontend/src/components/employees/EmployeeManagement.css`** - Component-specific typography
5. **`/frontend/src/components/employees/EmployeeList.jsx`** - Applied typography classes

### CSS Variables

All typography settings are defined as CSS custom properties (variables) in `:root`, making it easy to:

- Maintain consistency across the application
- Make global changes by updating variables
- Support theming and customization
- Ensure responsive typography

### Override Strategy

The typography system uses `!important` declarations in the override file to ensure that:

- Template styles don't interfere with our typography
- Consistent fonts are applied across all components
- The system works with existing Bootstrap and template classes

## Usage Guidelines

### For Developers

1. **Always use CSS variables** instead of hardcoded values
2. **Apply component classes** like `.table-header`, `.table-cell`, etc.
3. **Use utility classes** for quick typography adjustments
4. **Follow the established hierarchy** for headings and text

### For Designers

1. **Stick to the defined scale** for font sizes
2. **Use the color palette** for text colors
3. **Maintain consistent spacing** using the line-height values
4. **Follow the weight hierarchy** for different text elements

## Benefits

1. **Consistency**: Uniform typography across all pages and components
2. **Maintainability**: Easy to update fonts globally through CSS variables
3. **Performance**: Optimized font loading with Google Fonts
4. **Accessibility**: Proper contrast ratios and readable font sizes
5. **Modern Look**: Professional appearance similar to leading SaaS products
6. **Responsive**: Typography scales appropriately across devices

## Browser Support

- Modern browsers with CSS custom properties support
- Fallback fonts ensure compatibility with older browsers
- Optimized font loading for better performance

## Future Enhancements

- Dark mode typography variants
- Additional font weights if needed
- Custom font loading optimization
- Print-specific typography styles
