# CODEBET - Betting Platform

## Setup Instructions

### Backend
1. Navigate to `/backend` folder
2. Copy `.env.example` to `.env` and configure:
   - DATABASE_URL
   - JWT_SECRET
   - REDIS_URL
   - AGE_VERIFICATION_API_KEY
3. Run `npm install`
4. Run `npx prisma migrate dev`
5. Run `npm run dev`

### Frontend
1. Navigate to `/frontend` folder
2. Run `npm install`
3. Run `npm run dev`

## Features
- User authentication (register/login)
- Age verification via phone number
- Wallet management (deposit/withdraw)
- Live betting with real-time odds
- Crash games (Aviator)
- Admin dashboard
- Bet history and transaction logs

## Adding Sound Effects
Place these files in `frontend/public/sounds/`:
- `cashout.mp3` - Played when user cashes out
- `crash.mp3` - Played when game crashes
