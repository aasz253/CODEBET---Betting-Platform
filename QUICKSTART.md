# CODEBET - Quick Start Guide

## What We've Built

A full-stack betting platform with:
- **Frontend**: React + TypeScript + Tailwind CSS (dark theme)
- **Backend**: Node.js + Express + Prisma ORM + PostgreSQL
- **Features**: Betting, crash games (Aviator, JetX, etc.), wallet, M-Pesa integration, admin dashboard, compliance tools
- **PWA**: Mobile-first, offline support, installable
- **Documentation**: Complete API docs, deployment guides, compliance docs

## Current Status

✅ **Completed:**
- Backend builds successfully (all TypeScript errors fixed)
- Frontend builds successfully
- Backend tests passing (9/9 tests)
- Frontend tests passing (1/1 test)
- Documentation complete (6 markdown files in /docs)
- Docker configuration ready
- PWA setup complete

⏳ **Pending:**
- M-Pesa real API integration (you'll add later)
- Database migration (needs PostgreSQL)
- Deployment to free platforms
- BCLB licensing

## Quick Test (Local)

### Backend
```bash
cd backend
npm install
npx prisma generate
npm run build  # Should pass
npm test        # Should show 9/9 tests passing
```

### Frontend
```bash
cd frontend
npm install
npm run build  # Should pass
npm test        # Should show 1/1 test passing
```

### Run Development Servers
```bash
# Terminal 1 - Backend
cd backend && npm run dev  # Runs on :5000

# Terminal 2 - Frontend
cd frontend && npm run dev  # Runs on :3000
```

Visit http://localhost:3000 to see the app.

## Deploy to Free Platforms

### Option 1: Vercel (Frontend) + Render (Backend)

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   gh repo create codebet --public
   git push -u origin main
   ```

2. **Deploy Frontend to Vercel**:
   - Go to vercel.com → New Project
   - Import your GitHub repo
   - Set root directory to `frontend`
   - Add env var: `VITE_API_URL` = `https://your-backend.onrender.com`
   - Deploy!

3. **Deploy Backend to Render**:
   - Go to render.com → New Web Service
   - Connect your GitHub repo
   - Set root directory to `backend`
   - Build command: `npm install && npm run build`
   - Start command: `npm start`
   - Add env vars (see `/docs/FREE_HOSTING.md`)
   - Deploy!

4. **Add Database**:
   - In Render, create PostgreSQL database
   - Copy URL to backend's `DATABASE_URL`
   - Run migration: `npx prisma migrate deploy`

### Option 2: Netlify (Frontend) + Railway (Backend)

Similar to above, but with Netlify.com and Railway.app.

See `/docs/FREE_HOSTING.md` for detailed instructions.

## Add Real M-Pesa API Later

1. **Register with Safaricom**:
   - Go to developer.safaricom.co.ke
   - Register as a business
   - Get consumer key, secret, passkey

2. **Update Backend Environment**:
   ```bash
   MPESA_CONSUMER_KEY=your-key
   MPESA_CONSUMER_SECRET=your-secret
   MPESA_PASSKEY=your-passkey
   MPESA_SHORTCODE=your-shortcode
   MPESA_CALLBACK_URL=https://your-backend.onrender.com/api/wallet/mpesa-callback
   ```

3. **Test STK Push**:
   - Deposit from frontend
   - Check Safaricom portal for transactions

## Project Structure

```
codebet/
├── backend/              # Express + Prisma + TypeScript
│   ├── src/
│   │   ├── controllers/ # API controllers
│   │   ├── routes/      # API routes
│   │   ├── middleware/  # Auth, audit, responsible gaming
│   │   ├── services/    # Business logic
│   │   └── tests/      # Jest tests (9 passing)
│   ├── prisma/
│   │   └── schema.prisma # Database schema (17 models)
│   └── docker-compose.prod.yml
├── frontend/             # React + Vite + TypeScript
│   ├── src/
│   │   ├── pages/      # All pages (Login, Dashboard, etc.)
│   │   ├── components/ # Reusable components
│   │   ├── hooks/      # Custom hooks
│   │   ├── services/   # API services
│   │   └── __tests__/ # Tests (1 passing)
│   └── public/         # Static assets, PWA files
├── docs/                # Documentation
│   ├── DEPLOYMENT.md
│   ├── API.md
│   ├── DATABASE_SCHEMA.md
│   ├── COMPLIANCE.md
│   ├── CHECKLIST.md
│   └── FREE_HOSTING.md
└── nginx.conf            # Nginx config for production
```

## Key Features Implemented

✅ User authentication (JWT, 18+ age verification)
✅ Wallet system (deposit, withdraw, M-Pesa mock)
✅ Betting system (singles, multi, system bets)
✅ Live odds (WebSocket + Redis)
✅ Crash games (5 games with provably fair algorithm)
✅ Admin dashboard (users, bets, odds management)
✅ Compliance (audit logs, responsible gaming, self-exclusion)
✅ Referral system (codes, bonuses)
✅ PWA (manifest, service worker, offline)
✅ Docker & Nginx ready for production

## Next Steps

1. **Test locally** (instructions above)
2. **Push to GitHub**
3. **Deploy to free platforms** (Vercel + Render)
4. **Add real M-Pesa API** when ready
5. **Apply for BCLB license** (see `/docs/COMPLIANCE.md`)
6. **Launch!**

## Support

- **Documentation**: Check `/docs/` folder
- **API Endpoints**: See `/docs/API.md`
- **Deployment**: See `/docs/FREE_HOSTING.md`
- **Compliance**: See `/docs/COMPLIANCE.md`

## License

MIT License (feel free to modify and use)

---

**Ready to test and deploy!** 🚀
