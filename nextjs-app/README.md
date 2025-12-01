# TimePulse - Next.js Application

Modern timesheet management application built with Next.js 14 and App Router.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- Backend server running on port 5001
- npm or yarn package manager

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   # Copy the example environment file
   copy .env.example .env.local
   
   # Edit .env.local with your configuration
   ```

3. **Run the migration script (first time only):**
   ```powershell
   .\migrate-components.ps1
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   ```
   http://localhost:3000
   ```

## 📁 Project Structure

```
nextjs-app/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── layout.js          # Root layout with providers
│   │   ├── page.js            # Home page (redirects to login)
│   │   ├── login/             # Login page
│   │   ├── register/          # Registration page
│   │   ├── workspaces/        # Workspaces page
│   │   └── [subdomain]/       # Dynamic subdomain routes
│   │       ├── layout.js      # Subdomain layout with EmployerLayout
│   │       ├── dashboard/     # Dashboard pages
│   │       ├── timesheets/    # Timesheet pages
│   │       ├── clients/       # Client management pages
│   │       ├── employees/     # Employee management pages
│   │       ├── invoices/      # Invoice pages
│   │       ├── reports/       # Reports pages
│   │       ├── settings/      # Settings pages
│   │       └── leave/         # Leave management pages
│   │
│   ├── components/            # React components
│   │   ├── auth/             # Authentication components
│   │   ├── dashboard/        # Dashboard components
│   │   ├── timesheets/       # Timesheet components
│   │   ├── clients/          # Client components
│   │   ├── employees/        # Employee components
│   │   ├── invoices/         # Invoice components
│   │   ├── reports/          # Report components
│   │   ├── settings/         # Settings components
│   │   ├── leave/            # Leave management components
│   │   ├── layout/           # Layout components
│   │   └── common/           # Shared components
│   │
│   ├── contexts/             # React Context providers
│   │   ├── AuthContext.js    # Authentication context
│   │   ├── ThemeContext.js   # Theme (dark/light) context
│   │   ├── ToastContext.jsx  # Toast notification context
│   │   └── WebSocketContext.js # WebSocket connection context
│   │
│   ├── services/             # API and service functions
│   │   ├── engineService.js
│   │   ├── fileUploadService.js
│   │   ├── pdfUtils.js
│   │   └── timesheetExtractor.js
│   │
│   ├── utils/                # Utility functions
│   │   ├── roles.js          # Role and permission definitions
│   │   ├── validation.js     # Validation functions
│   │   └── validations.js
│   │
│   ├── hooks/                # Custom React hooks
│   │   └── useConfirmation.js
│   │
│   ├── constants/            # Application constants
│   │   └── lookups.js
│   │
│   └── styles/               # Global styles
│       ├── globals.css       # Global CSS
│       ├── theme.css         # Theme variables
│       ├── responsive.css    # Responsive styles
│       ├── typography-override.css
│       └── icon-preservation.css
│
├── public/                   # Static assets
│   ├── assets/
│   ├── favicon.ico
│   └── ...
│
├── middleware.js             # Next.js middleware (authentication)
├── next.config.js            # Next.js configuration
├── jsconfig.json             # JavaScript configuration
├── package.json              # Dependencies
├── .env.example              # Environment variables example
├── .gitignore                # Git ignore rules
├── MIGRATION_GUIDE.md        # Detailed migration guide
├── migrate-components.ps1    # Migration automation script
└── README.md                 # This file
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# Backend API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5001
NEXT_PUBLIC_SOCKET_URL=http://localhost:5001

# Application Configuration
NEXT_PUBLIC_APP_NAME=TimePulse
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Backend Server

Ensure your backend server is running:

```bash
cd ../server
npm start
```

The backend should be accessible at `http://localhost:5001`

## 📚 Key Features

### 1. Authentication
- JWT-based authentication
- Cookie and localStorage support for SSR
- Protected routes with middleware
- Role-based permissions

### 2. Multi-Tenant Support
- Subdomain-based routing
- Tenant isolation
- Workspace switching

### 3. Timesheet Management
- Weekly timesheet entry
- Approval workflow
- History tracking
- Mobile upload support

### 4. Client & Employee Management
- CRUD operations
- Detailed profiles
- Relationship management

### 5. Invoice Generation
- Automated from timesheets
- Manual invoice creation
- PDF export
- Email sending

### 6. Reports & Analytics
- Client-wise reports
- Employee-wise reports
- Time tracking analytics
- Export functionality

### 7. Leave Management
- Leave requests
- Approval workflow
- Balance tracking
- Calendar integration

### 8. Theme System
- Light/Dark mode
- Persistent preferences
- Smooth transitions
- Comprehensive theming

## 🛠️ Development

### Available Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

### Code Style

- Use `'use client'` directive for client components
- Use `@/` alias for imports
- Follow existing component patterns
- Maintain TypeScript-ready code structure

### Adding New Pages

1. Create a new directory in `src/app/[subdomain]/`
2. Add a `page.js` file
3. Import and use your component
4. Add protection if needed:

```javascript
'use client';

import ProtectedRoute from '@/components/common/ProtectedRoute';
import YourComponent from '@/components/your-module/YourComponent';
import { PERMISSIONS } from '@/utils/roles';

export default function YourPage() {
  return (
    <ProtectedRoute requiredPermission={PERMISSIONS.YOUR_PERMISSION}>
      <YourComponent />
    </ProtectedRoute>
  );
}
```

## 🔄 API Integration

### API Proxy

All `/api/*` requests are automatically proxied to the backend server (configured in `next.config.js`):

```javascript
// Automatically proxied to http://localhost:5001/api/users
fetch('/api/users')
```

### Direct API Calls

For explicit API calls:

```javascript
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const response = await axios.get(`${API_URL}/api/users`);
```

## 🧪 Testing

### Manual Testing Checklist

- [ ] Login/Logout functionality
- [ ] Protected route access
- [ ] Theme switching
- [ ] Timesheet CRUD operations
- [ ] Client management
- [ ] Employee management
- [ ] Invoice generation
- [ ] Report generation
- [ ] Leave management
- [ ] WebSocket notifications
- [ ] File uploads
- [ ] PDF generation
- [ ] Responsive design

## 🚢 Deployment

### Production Build

```bash
npm run build
npm start
```

### Environment Variables for Production

Update `.env.local` with production values:

```env
NEXT_PUBLIC_API_URL=https://your-api-domain.com
NEXT_PUBLIC_SOCKET_URL=https://your-api-domain.com
NEXT_PUBLIC_APP_URL=https://your-app-domain.com
```

### Deployment Platforms

This Next.js app can be deployed to:

- **Vercel** (recommended)
- **Netlify**
- **AWS Amplify**
- **Docker**
- **Traditional Node.js hosting**

## 📖 Documentation

- [Migration Guide](./MIGRATION_GUIDE.md) - Detailed migration instructions
- [Next.js Documentation](https://nextjs.org/docs)
- [Next.js App Router](https://nextjs.org/docs/app)

## 🔍 Troubleshooting

### Common Issues

**1. "window is not defined"**
- Wrap browser API calls in `typeof window !== 'undefined'` check
- Ensure component has `'use client'` directive

**2. "Cannot find module '@/...'"**
- Check `jsconfig.json` is present
- Restart development server

**3. API calls failing**
- Verify backend server is running on port 5001
- Check `next.config.js` proxy configuration
- Verify environment variables

**4. Authentication not persisting**
- Check cookie settings in AuthContext
- Verify middleware configuration
- Check browser console for errors

**5. Styles not loading**
- Ensure CSS imports are in the correct location
- Check for CSS module naming (`.module.css`)
- Verify global styles are imported in `layout.js`

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📝 License

Proprietary - All rights reserved

## 🆘 Support

For issues or questions:
1. Check the [Migration Guide](./MIGRATION_GUIDE.md)
2. Review the [Troubleshooting](#troubleshooting) section
3. Check browser console and terminal for errors
4. Contact the development team

---

**Version:** 1.0.0  
**Last Updated:** December 2024  
**Framework:** Next.js 14 with App Router
