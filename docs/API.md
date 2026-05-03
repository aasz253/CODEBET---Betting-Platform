# CODEBET API Documentation

Base URL: `http://localhost:5000/api` (dev) or `https://your-domain.com/api` (prod)

## Authentication

All protected endpoints require JWT token in header:
```
Authorization: Bearer <token>
```

### POST /auth/register
Register new user (must be 18+)

**Body:**
```json
{
  "phoneNumber": "0722000000",
  "password": "securepassword",
  "fullName": "John Doe",
  "idNumber": "12345678",
  "dateOfBirth": "2000-01-01",
  "confirmAge": true,
  "referralCode": "optional-referral-code"
}
```

**Response:** 201 Created
```json
{
  "message": "Registration successful",
  "user": { "id": "...", "phoneNumber": "...", "fullName": "...", "isAgeVerified": true, "role": "USER" },
  "token": "..."
}
```

### POST /auth/login
Login with phone and password

**Body:**
```json
{
  "phoneNumber": "0722000000",
  "password": "securepassword"
}
```

**Response:** 200 OK
```json
{
  "message": "Login successful",
  "user": { ... },
  "token": "..."
}
```

## Wallet

### POST /wallet/deposit
Deposit money via M-Pesa (minimum 1 KES)

**Body:**
```json
{
  "phoneNumber": "0722000000",
  "amount": 1000,
  "description": "Deposit"
}
```

**Response:** 200 OK
```json
{
  "message": "STK push sent successfully",
  "checkoutRequestID": "...",
  "amount": 1000
}
```

### POST /wallet/withdraw
Withdraw money (minimum 100 KES)

**Body:**
```json
{
  "phoneNumber": "0722000000",
  "amount": 500
}
```

### GET /wallet/balance
Get current wallet balance

**Response:** 200 OK
```json
{
  "balance": 5000.00
}
```

### GET /wallet/transactions
Get transaction history

**Response:** 200 OK
```json
{
  "transactions": [
    {
      "id": "...",
      "type": "DEPOSIT",
      "amount": 1000.00,
      "status": "COMPLETED",
      "createdAt": "2026-01-01T10:00:00.000Z"
    }
  ]
}
```

## Betting

### POST /bets/betslip
Create bet slip

**Body:**
```json
{
  "userId": "user-id",
  "betType": "SINGLE",
  "bets": [
    {
      "eventId": "event-id",
      "marketId": "market-id",
      "oddsId": "odds-id",
      "oddsValue": 2.5,
      "stake": 100
    }
  ]
}
```

### POST /bets/place
Place bet (deduct stake from wallet)

**Body:**
```json
{
  "betSlipId": "bet-slip-id"
}
```

### GET /bets/history/:userId
Get user's bet history

**Response:** 200 OK
```json
{
  "betSlips": [
    {
      "id": "...",
      "totalStake": 100,
      "totalPotentialWin": 250,
      "betType": "SINGLE",
      "isPlaced": true,
      "createdAt": "2026-01-01T10:00:00.000Z"
    }
  ]
}
```

## Events & Odds

### GET /events
Get all events (with filters)

**Query params:** `?sport=football&league=Premier League&status=LIVE`

### GET /events/:id
Get single event details

### GET /odds/:eventId
Get live odds for event

**Response:** 200 OK
```json
{
  "eventId": "...",
  "odds": [
    {
      "marketId": "...",
      "marketType": "MATCH_WINNER",
      "marketName": "Match Winner",
      "odds": [
        { "id": "...", "value": 2.5, "label": "Home", "isActive": true }
      ]
    }
  ]
}
```

### PUT /odds/:eventId
Update odds (admin only)

**Body:**
```json
{
  "marketId": "market-id",
  "oddsValue": 2.75,
  "isActive": true
}
```

## Crash Games

### GET /crash/games
Get available crash games

### POST /crash/:gameType/bet
Place bet on crash game (minimum 1 KES)

**Body:**
```json
{
  "userId": "user-id",
  "stake": 100
}
```

### POST /crash/:gameType/cashout
Cash out before crash

**Body:**
```json
{
  "gameId": "game-id",
  "userId": "user-id"
}
```

## Admin (Requires ADMIN role)

### GET /admin/dashboard
Get admin dashboard stats

**Response:** 200 OK
```json
{
  "totalUsers": 1000,
  "totalBets": 5000,
  "totalStakes": 500000,
  "houseProfit": 25000,
  "recentBets": [...]
}
```

### GET /admin/users
Search users (debounce 300ms)

**Query params:** `?search=0722`

### POST /admin/users/:id/suspend
Suspend user

### PUT /admin/bet-limits/:userId
Update user bet limits

## Compliance

### GET /compliance/audit-logs
Get audit logs (admin only)

**Query params:** `?startDate=2026-01-01&endDate=2026-01-31&userId=...&action=BET_PLACED`

### GET /compliance/daily-summary
Get daily financial summary

**Query params:** `?date=2026-01-01`

### GET /compliance/responsible-gaming-report
Get responsible gaming report (self-excluded users)

### GET /compliance/export-audit
Export audit logs as CSV/JSON

### POST /compliance/send-report
Send compliance report to regulator

## Responsible Gaming

### GET /responsible-gaming/settings
Get user's responsible gaming settings

### PUT /responsible-gaming/settings
Update settings (can only lower limits)

**Body:**
```json
{
  "dailyLossLimit": 50000,
  "monthlyDepositLimit": 200000,
  "coolDownMinutes": 10,
  "enableRealityCheck": true,
  "realityCheckMinutes": 60
}
```

### POST /responsible-gaming/self-exclude
Self-exclude from betting

**Body:**
```json
{
  "duration": "24h" | "7d" | "permanent"
}
```

## Referrals

### GET /referrals/code
Get user's referral code

### GET /referrals/stats
Get referral statistics

**Response:** 200 OK
```json
{
  "referralCode": "...",
  "totalReferrals": 5,
  "totalBonusEarned": 25000,
  "pendingBonuses": [...]
}
```

### POST /referrals/track
Track referral (called during registration)

## WebSocket Events

### Odds Updates
- **Channel:** `odds-updates`
- **Event:** `odds-update`
- **Payload:** `{ eventId, marketId, oddsId, value, isActive }`

### Aviator Game
- **Event:** `aviator-game-state`
- **Payload:** `{ gameId, status, startTime, currentMultiplier, crashPoint }`
- **Event:** `aviator-bet-placed`
- **Event:** `aviator-cashout`

## Health Check

### GET /health
Check service health

**Response:** 200 OK
```json
{
  "status": "healthy",
  "checks": {
    "database": "connected",
    "redis": "connected"
  }
}
```
