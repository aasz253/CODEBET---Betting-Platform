# CODEBET Free Hosting Guide

## Free Hosting Platforms

### Frontend (React SPA)
1. **Vercel** (recommended)
   - Free tier: Unlimited deployments
   - Automatic HTTPS
   - Custom domains supported
   - Setup: Push to GitHub → Import project on Vercel

2. **Netlify**
   - Free tier: 100GB bandwidth/month
   - Form handling, serverless functions
   - Setup: Push to GitHub → Connect repo on Netlify

3. **GitHub Pages**
   - Free tier: Public repos only
   - Custom domain support
   - Setup: Build → Deploy to gh-pages branch

### Backend (Node.js API)
1. **Render** (recommended)
   - Free tier: 750 hours/month (enough for 24/7)
   - PostgreSQL database included (90 days retention)
   - Redis available via add-ons

2. **Railway**
   - Free trial: $5 credit (enough for ~2 months)
   - PostgreSQL + Redis included
   - Easy deployment from GitHub

3. **Fly.io**
   - Free tier: 3 shared-cpu-1x VMs
   - 3GB persistent volume storage
   - PostgreSQL and Redis available

## Deployment Steps (Vercel + Render)

### Frontend (Vercel)
1. Push code to GitHub
2. Go to vercel.com → New Project
3. Import your GitHub repo
4. Configure:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Add Environment Variables:
   - `VITE_API_URL`: Your backend URL (e.g., https://codebet-api.onrender.com)
6. Deploy!

### Backend (Render)
1. Push code to GitHub
2. Go to render.com → New → Web Service
3. Connect your GitHub repo
4. Configure:
   - Runtime: Node
   - Build Command: `cd backend && npm install && npm run build`
   - Start Command: `cd backend && npm start`
5. Add Environment Variables:
   - `DATABASE_URL`: Your PostgreSQL URL (or use Render's internal database)
   - `REDIS_URL`: Your Redis URL
   - `JWT_SECRET`: Generate a secure random string
   - `MPESA_CONSUMER_KEY`: Add later when ready
   - `MPESA_CONSUMER_SECRET`: Add later
   - `NODE_ENV`: production
6. Create Web Service!

## Database Options (Free)

### PostgreSQL
- **Render**: Free tier PostgreSQL (90 days retention)
- **Supabase**: Free tier (500MB database)
- **Neon**: Free tier (3 branches, autoscaling)

### Redis
- **Render**: Redis add-on (free tier available)
- **Upstash**: Free tier (10,000 requests/day)

## Environment Variables for Production

### Frontend (.env.production)
```
VITE_API_URL=https://your-backend.onrender.com
```

### Backend
```
DATABASE_URL="postgresql://user:pass@host:5432/db"
REDIS_URL="redis://host:6379"
JWT_SECRET="your-super-secret-key-change-this"
JWT_EXPIRES_IN="7d"
MPESA_CONSUMER_KEY="" # Add later
MPESA_CONSUMER_SECRET="" # Add later
MPESA_PASSKEY="" # Add later
MPESA_SHORTCODE="" # Add later
MPESA_CALLBACK_URL="https://your-backend.onrender.com/api/wallet/mpesa-callback"
AGE_VERIFICATION_API_KEY="" # Add later
FOOTBALL_API_KEY="4e031aec0d80491fb7a3e28d9368990c"
REFERRAL_BONUS_AMOUNT=5000
WELCOME_BONUS_AMOUNT=100
FRIDAY_BONUS_PERCENTAGE=50
FRIDAY_BONUS_MAX=5000
ADMIN_PHONE="0722000000"
ADMIN_PASSWORD="admin-secure-password"
NODE_ENV="production"
```

## Post-Deployment Steps

1. **Test the deployment**:
   - Frontend: https://your-app.vercel.app
   - Backend health: https://your-backend.onrender.com/health

2. **Initialize database**:
   ```bash
   # Using Render shell or local with production DATABASE_URL
   npx prisma migrate deploy
   ```

3. **Create admin user** (via API or database):
   ```bash
   curl -X POST https://your-backend.onrender.com/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"phoneNumber":"0722000000","password":"admin-secure-password","fullName":"Admin","idNumber":"12345678","dateOfBirth":"1990-01-01","confirmAge":true}'
   ```

4. **Update admin role** (via database):
   ```sql
   UPDATE "User" SET role = 'ADMIN' WHERE "phoneNumber" = '0722000000';
   ```

5. **Configure M-Pesa** (when ready):
   - Get production credentials from Safaricom
   - Update environment variables on Render
   - Test STK Push

## Limitations of Free Tiers

### Vercel
- Bandwidth: Unlimited (fair use)
- Build minutes: 6,000/month
- Serverless functions: 10s execution limit

### Render
- Free tier spins down after 15 minutes of inactivity (cold start ~30s)
- PostgreSQL: 90 days retention (then deleted)
- No guaranteed uptime SLA

### Workarounds
- Use **UptimeRobot** (free) to ping your backend every 14 minutes to prevent sleep
- Export database backups regularly
- Upgrade to paid tier when you have paying users

## Custom Domain (Optional)

### Frontend
1. Buy domain (e.g., codebet.co.ke from Kenya registry)
2. Add domain in Vercel project settings
3. Update DNS records as instructed

### Backend
1. Add domain/subdomain in Render
2. Update DNS records
3. SSL certificate auto-provisioned

## Monitoring (Free)

### Frontend
- Vercel Analytics (built-in)
- Sentry (free tier: 5,000 errors/month)

### Backend
- Render logs (built-in)
- UptimeRobot (free: 50 monitors)

## Next Steps After Deployment

1. **Test full flow**:
   - Register new user
   - Deposit (mock M-Pesa)
   - Place bet
   - Play crash game

2. **Configure M-Pesa** (when ready):
   - Register as business with Safaricom
   - Get production API credentials
   - Update backend environment variables
   - Test STK Push in production

3. **Apply for BCLB license**:
   - Prepare compliance documents
   - Submit application
   - Pay licensing fee

4. **Marketing**:
   - Share on social media
   - Referral program
   - Welcome bonus promotion

## Cost Summary (Free Tier)

- Frontend hosting: $0 (Vercel)
- Backend hosting: $0 (Render)
- PostgreSQL: $0 (Render)
- Redis: $0 (Render add-on or Upstash)
- Domain: $10-20/year (optional)
- SSL: $0 (auto-provisioned)

**Total monthly cost: $0** (until you upgrade or get paying users)
