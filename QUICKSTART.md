# Quick Start Guide

## 5-Minute Setup

### 1. Install Dependencies
```bash
cd d:\KrewAi\Krew-Ai-Frontend
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Files Overview

### Essential Configuration
- **`.env.local`** - Backend API URL (already configured)
- **`package.json`** - All dependencies installed
- **`tailwind.config.ts`** - Design tokens and theme

### Main Application
- **`app/page.tsx`** - Landing page (entry point)
- **`app/layout.tsx`** - Root layout wrapper
- **`app/globals.css`** - Global theme and styles

### Authentication Pages
- **`app/auth/signup/page.tsx`** - User registration
- **`app/auth/login/page.tsx`** - User login
- **`lib/auth.ts`** - JWT token management
- **`lib/api.ts`** - API client with all endpoints

### Onboarding
- **`app/onboarding/page.tsx`** - 4-step flow

### Dashboard
- **`app/dashboard/page.tsx`** - Agent selection
- **`app/dashboard/luna/page.tsx`** - Luna overview
- **`app/dashboard/luna/conversations/page.tsx`** - Conversations
- **`app/dashboard/luna/knowledge-base/page.tsx`** - KB editor
- **`app/dashboard/luna/settings/page.tsx`** - Settings

### Components
- **`components/Navigation.tsx`** - Top navigation
- **`components/LunaSidebar.tsx`** - Dashboard sidebar
- **`components/ThemeProvider.tsx`** - Theme management

### Utilities
- **`middleware.ts`** - Route protection

## User Flow

### First-Time User
1. Visit **http://localhost:3000** (landing page)
2. Click "Sign up"
3. Fill signup form → Creates account
4. 4-step onboarding → Saves preferences
5. Redirects to **My Krew dashboard**
6. Click **Luna** card → Luna dashboard
7. Navigate using sidebar

### Returning User
1. Visit **http://localhost:3000**
2. Click "Log in"
3. Enter credentials
4. Redirects to **My Krew dashboard**

## Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## API Endpoints (Backend Required)

Your backend needs these endpoints:

```
POST /auth/signup
POST /auth/login
GET /auth/me
POST /auth/onboarding
GET /knowledge-base
POST /knowledge-base
GET /conversations
```

See `lib/api.ts` for request/response formats.

## Environment Setup

The `.env.local` file is pre-configured:

```env
NEXT_PUBLIC_API_URL=https://krew-ai-backend-production.up.railway.app
```

Change this if your backend is hosted elsewhere.

## Key Features to Test

### ✅ Authentication
- [ ] Sign up with new email
- [ ] See confirmation onboarding screen
- [ ] Log in with credentials
- [ ] Log out from dropdown menu
- [ ] Verify protected routes redirect to login

### ✅ Onboarding
- [ ] Complete all 4 steps
- [ ] Go back to previous steps
- [ ] See progress bar update
- [ ] View loading screen after finishing
- [ ] Redirect to dashboard

### ✅ Dashboard
- [ ] View Luna agent card (clickable)
- [ ] See "Coming Soon" for other agents
- [ ] Click Luna to open dashboard
- [ ] Navigate using sidebar

### ✅ Luna Dashboard
- [ ] **Overview**: See stat cards and activity
- [ ] **Conversations**: View conversation table
- [ ] **Knowledge Base**: Add/edit/delete Q&A rows
- [ ] **Settings**: Update Luna config and integrations

### ✅ Responsive Design
- [ ] Resize browser window
- [ ] View mobile sidebar toggle
- [ ] Check mobile grid layouts
- [ ] Test touch interactions (if on mobile device)

### ✅ Theme Toggle
- [ ] Click theme toggle in top nav
- [ ] Colors switch from dark to light
- [ ] Theme persists on page reload

## Mock Data

The application includes mock data for testing:

```typescript
// Conversations mock
{
  id: '1',
  customer: 'Sarah M.',
  message: 'Is this item available in size M?',
  platform: 'instagram',
  status: 'resolved',
  timestamp: '2 hours ago'
}

// Knowledge Base mock
{
  id: '1',
  question: 'What is your return policy?',
  answer: 'We accept returns within 30 days...'
}
```

Edit these in the respective page files to test UI changes.

## Connecting to Real Backend

When your backend is ready:

1. Update endpoint URLs in `lib/api.ts`
2. Test signup → should get JWT token
3. Check token in browser DevTools:
   ```javascript
   localStorage.getItem('krew_token')
   ```
4. Verify API calls in Network tab

## Troubleshooting

### Port 3000 already in use
```bash
npm run dev -- -p 3001
```

### Theme not changing
```javascript
// Reset theme
localStorage.removeItem('theme')
// Clear data
localStorage.clear()
// Reload page
```

### Can't access dashboard
- Make sure you're logged in
- Check localStorage for `krew_token`
- Verify you completed onboarding

### API calls failing
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Verify backend is running
- Check CORS headers from backend
- Look at browser Network tab for errors

## File Structure at a Glance

```
app/
├── page.tsx                 ← Start here (landing)
├── layout.tsx
├── globals.css
├── auth/
│   ├── signup/page.tsx
│   └── login/page.tsx
├── onboarding/page.tsx
└── dashboard/
    ├── page.tsx
    └── luna/
        ├── page.tsx
        ├── conversations/page.tsx
        ├── knowledge-base/page.tsx
        └── settings/page.tsx

components/
├── Navigation.tsx           ← Always visible
├── LunaSidebar.tsx         ← In Luna dashboard
└── ThemeProvider.tsx       ← Theme management

lib/
├── api.ts                  ← All API calls
└── auth.ts                 ← Token management
```

## Next Steps

1. ✅ Run `npm install` and `npm run dev`
2. ✅ Test signup/login flow
3. ✅ Test onboarding
4. ✅ Explore dashboard pages
5. ✅ Test theme toggle
6. ✅ Resize browser for responsive design
7. ✅ Connect to real backend API
8. ✅ Deploy to Vercel or your hosting

## Documentation Files

- **`README.md`** - Complete project documentation
- **`BUILD_SUMMARY.md`** - What was built and why
- **`QUICKSTART.md`** - This file

## Support

If you encounter issues:

1. Check the console (F12 → Console tab)
2. Check Network tab for API errors
3. Verify `.env.local` settings
4. Review `README.md` for detailed docs
5. Check `BUILD_SUMMARY.md` for architecture

---

**Happy coding! 🚀**