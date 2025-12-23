# ForgotPassword Component - Next.js Conversion

## Quick Start

This directory contains the converted Next.js version of the ForgotPassword React component.

## File Structure

```
nextjs-converted/
├── app/
│   └── forgot-password/
│       ├── page.jsx              # Main component
│       └── forgot-password.css   # Styles
├── public/
│   └── images/
│       └── TimePulseLogoAuth.png # Logo (move here)
├── CONVERSION_NOTES.md           # Detailed conversion documentation
└── README.md                     # This file
```

## Setup Instructions

### 1. Copy Files to Your Next.js Project

```bash
# Copy the page component
cp -r app/forgot-password your-nextjs-project/app/

# Copy the logo
mkdir -p your-nextjs-project/public/images
cp path/to/TimePulseLogoAuth.png your-nextjs-project/public/images/
```

### 2. Configure Environment Variables

Create or update `.env.local`:

```env
NEXT_PUBLIC_API_BASE=http://44.222.217.57:5001
```

### 3. Install Dependencies (if needed)

```bash
npm install next react react-dom
```

### 4. Configure Path Aliases (Optional)

Add to `jsconfig.json` or `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### 5. Add Font Awesome

In your root layout (`app/layout.jsx`):

```jsx
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link 
          rel="stylesheet" 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" 
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

## Key Changes from React

1. **'use client' directive** - Required for client-side interactivity
2. **next/link** - Replaced react-router-dom Link
3. **next/image** - Optimized image component
4. **NEXT_PUBLIC_** - Environment variable prefix
5. **File-based routing** - No route configuration needed

## Testing

Visit `https://goggly-casteless-torri.ngrok-free.dev/forgot-password` after starting your Next.js dev server:

```bash
npm run dev
```

## Documentation

See `CONVERSION_NOTES.md` for:
- Detailed conversion changes
- Best practices
- Suggested improvements
- Testing recommendations
- Security considerations

## Features Preserved

✅ Email validation  
✅ Loading states  
✅ Error handling  
✅ Success messaging  
✅ Email enumeration prevention  
✅ Responsive design  
✅ Floating animations  
✅ All original styling

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

Same as TimePulse project
