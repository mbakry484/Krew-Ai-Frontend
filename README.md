# Krew AI Frontend

A Next.js application for the Krew AI customer operations platform. This is a fully functional React/Next.js frontend that matches the design and flow of the original HTML prototype.

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS + Custom CSS
- **Language**: TypeScript
- **Authentication**: JWT tokens (stored in localStorage)
- **State Management**: React hooks
- **API Communication**: Fetch API

## Project Structure

```
app/
  ├── page.tsx                          # Landing page
  ├── layout.tsx                        # Root layout
  ├── globals.css                       # Global styles
  ├── auth/
  │   ├── signup/page.tsx               # User registration
  │   └── login/page.tsx                # User login
  ├── onboarding/page.tsx               # 4-step onboarding flow
  └── dashboard/
      ├── page.tsx                      # My Krew (agent selection)
      └── luna/
          ├── page.tsx                  # Luna Overview
          ├── conversations/page.tsx    # Conversations list
          ├── knowledge-base/page.tsx   # Knowledge Base editor
          └── settings/page.tsx         # Settings & Integrations

components/
  ├── Navigation.tsx                    # Top navigation bar
  ├── ThemeProvider.tsx                 # Theme context (light/dark)
  └── LunaSidebar.tsx                   # Luna dashboard sidebar

lib/
  ├── api.ts                            # API client functions
  └── auth.ts                           # Authentication helpers

middleware.ts                           # Route protection middleware
```

## Key Features

### 1. **Authentication Flow**
- Signup → Onboarding → Dashboard
- Login redirects to dashboard
- JWT token management with localStorage
- Protected routes redirect to login if unauthenticated

### 2. **Theme System**
- Light/Dark mode toggle
- Theme persisted in localStorage
- CSS variables for dynamic theming

### 3. **Responsive Design**
- Mobile-first approach
- Sidebar collapses on mobile
- Grid layouts adapt to screen size
- Touch-friendly navigation

### 4. **Pages**

**Landing Page** (`/`)
- Hero section with CTA
- Feature breakdown (4 mini-cards)
- Intelligence layer explanation
- Product roadmap (Luna → Ivy → coming agents)
- Call-to-action section

**Signup** (`/auth/signup`)
- First name, last name, email, password
- Form validation
- API integration with `/auth/signup`
- Redirects to onboarding on success

**Login** (`/auth/login`)
- Email and password
- API integration with `/auth/login`
- Redirects to dashboard on success

**Onboarding** (`/onboarding`)
- 4-step flow with progress bar
- Step 1: Business type
- Step 2: Revenue range
- Step 3: DM volume
- Step 4: Main challenge
- Loading animation after completion
- Welcome toast notification

**My Krew Dashboard** (`/dashboard`)
- Agent selection grid
- Luna (available)
- Ivy, and 2 future agents (coming soon)
- Notification chips
- Agent statistics

**Luna Overview** (`/dashboard/luna`)
- 4 stat cards (conversations, resolved, response time, satisfaction)
- Recent activity list
- Top issues widget

**Conversations** (`/dashboard/luna/conversations`)
- Table of customer conversations
- Platform badges (Instagram, WhatsApp)
- Status indicators (resolved, escalated, pending)

**Knowledge Base** (`/dashboard/luna/knowledge-base`)
- Editable Q&A table
- Add/delete rows
- Save changes to API
- Success toast on save

**Settings** (`/dashboard/luna/settings`)
- Luna configuration (name, personality, language)
- Escalation threshold settings
- Notifications toggle
- Integration cards (Shopify, Meta, Bosta)
- Connect/disconnect buttons

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Create .env.local file (already included)
# Update NEXT_PUBLIC_API_URL if needed
NEXT_PUBLIC_API_URL=https://krew-ai-backend-production.up.railway.app
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## API Integration

All API calls are centralized in `lib/api.ts`:

### Authentication
- `signup(data)` → `POST /auth/signup`
- `login(data)` → `POST /auth/login`
- `getUserInfo()` → `GET /auth/me`

### Onboarding
- `saveOnboarding(data)` → `POST /auth/onboarding`

### Knowledge Base
- `getKnowledgeBase()` → `GET /knowledge-base`
- `saveKnowledgeBase(items)` → `POST /knowledge-base`

### Conversations
- `getConversations()` → `GET /conversations`

### JWT Token Management

```typescript
// Store token
localStorage.setItem('krew_token', token);

// Get token
const token = localStorage.getItem('krew_token');

// Clear token (logout)
localStorage.removeItem('krew_token');
```

All API requests automatically include the JWT in the `Authorization` header.

## Environment Variables

```env
# Backend API URL
NEXT_PUBLIC_API_URL=https://krew-ai-backend-production.up.railway.app
```

## Authentication Flow

1. **Signup**: User creates account → API returns JWT token → Stored in localStorage
2. **Onboarding**: User completes 4 steps → Data sent to `/auth/onboarding`
3. **Dashboard**: User selects agent or manages Luna
4. **Logout**: Token cleared from localStorage, redirect to login

## Theme Implementation

The theme system uses CSS variables that respond to `data-theme` attribute on `<html>` element:

```typescript
// In ThemeProvider component
document.documentElement.setAttribute('data-theme', 'light' | 'dark');

// CSS variables defined in globals.css
[data-theme="dark"] {
  --bg: #0f0f0f;
  --text-primary: #e8e8e8;
  // ... more variables
}
```

## Styling Approach

The project uses a hybrid approach:

1. **Tailwind CSS** for utility classes and responsive design
2. **CSS Custom Properties (Variables)** for theme colors
3. **Inline styles** for component-specific animations

All CSS variables are theme-aware and switch automatically.

## Key Components

### Navigation (`components/Navigation.tsx`)
- Responsive header with logo, theme toggle, and auth buttons
- Dropdown menu when logged in
- Theme switching with persistence

### ThemeProvider (`components/ThemeProvider.tsx`)
- React Context for theme management
- Persists theme preference to localStorage
- Provides `useTheme()` hook

### LunaSidebar (`components/LunaSidebar.tsx`)
- Navigation for Luna dashboard
- Mobile-responsive with toggle button
- Active state highlighting

## Security Notes

- JWT tokens stored in localStorage (not httpOnly due to Next.js limitations)
- Consider moving to cookies for production
- All API requests require valid token
- Routes protected via middleware
- Sensitive operations should validate on backend

## Performance Optimizations

- Next.js Image optimization (when images added)
- CSS variables avoid runtime style calculations
- Component code-splitting via dynamic imports
- Minimal JavaScript bundle size
- CSS animations for smooth transitions

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Future Enhancements

1. Add image optimization for agent cards
2. Implement real-time conversation updates (WebSocket)
3. Add charts/graphs for analytics
4. Implement Shopify integration flow
5. Add export functionality for reports
6. Implement role-based access control (RBAC)
7. Add activity logging and audit trail
8. Implement search across conversations

## Troubleshooting

### 401 Unauthorized on API calls
- Check that token is stored in localStorage under key `krew_token`
- Verify API endpoint is correct in `.env.local`
- Check token hasn't expired

### Theme not persisting
- Clear browser localStorage: `localStorage.clear()`
- Check that `data-theme` attribute is on `<html>` element

### Protected routes redirecting to login
- Ensure you're logged in (token in localStorage)
- Check middleware configuration in `middleware.ts`

## Support

For issues or questions, contact the development team.