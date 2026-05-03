# CODEBET Database Schema

## Overview
CODEBET uses PostgreSQL with Prisma ORM. The schema consists of 17 models covering users, betting, wallets, events, crash games, and compliance.

## Models

### User
Core user model with age verification and referral system.

```prisma
model User {
  id              String    @id @default(uuid())
  phoneNumber     String    @unique
  password        String
  fullName        String
  idNumber        String    @unique
  dateOfBirth     DateTime
  isVerified      Boolean   @default(false)
  isAgeVerified   Boolean   @default(false)
  ageVerifiedAt   DateTime?
  role            UserRole  @default(USER)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  firstLoginAt    DateTime?
  ageWarningShown Boolean   @default(false)

  // Relations
  wallet                    Wallet?
  transactions              Transaction[]
  sessions                  Session[]
  betSlips                  BetSlip[]
  bets                      Bet[]
  betLimits                 BetLimit[]
  suspendedUser             SuspendedUser?
  crashGameBets             CrashGameBet[]
  responsibleGamingSettings ResponsibleGamingSettings?
  selfExclusion             SelfExclusion?
  referralCode              String                     @unique @default(uuid())
  referredBy                String?
  referralsMade             Referral[]                 @relation("ReferralReferrer")
  referralsReceived         Referral[]                 @relation("ReferralReferred")
  bonuses                   Bonus[]
  auditLogs                 AuditLog[]
}
```

### Wallet
User's wallet with balance in KES.

```prisma
model Wallet {
  id        String   @id @default(uuid())
  userId    String   @unique
  balance   Decimal  @default(0) @db.Decimal(12, 2)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### Transaction
Financial transactions (deposits, withdrawals, bets, wins).

```prisma
model Transaction {
  id        String            @id @default(uuid())
  userId    String
  type      TransactionType
  amount    Decimal           @db.Decimal(12, 2)
  status    TransactionStatus @default(PENDING)
  reference String            @unique
  createdAt DateTime          @default(now())
  updatedAt DateTime          @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Transaction Types:** DEPOSIT, WITHDRAW, BET, WIN

**Transaction Status:** PENDING, COMPLETED, FAILED

### Event
Sports events with odds.

```prisma
model Event {
  id          String       @id @default(uuid())
  status      EventStatus  @default(PENDING)
  sport       String
  league      String
  homeTeam    String
  awayTeam    String
  startTime   DateTime
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  markets     Market[]
  liveMatch   LiveMatch?
  bets        Bet[]
}
```

**Event Status:** PENDING, LIVE, FINISHED, CANCELLED

### Market & Odds
Markets (e.g., Match Winner) with odds history.

```prisma
model Market {
  id        String      @id @default(uuid())
  eventId   String
  type      MarketType
  name      String
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt

  event     Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  odds      Odds[]
}

model Odds {
  id        String   @id @default(uuid())
  marketId  String
  value     Decimal  @db.Decimal(6, 2)
  current   Boolean  @default(true)
  isActive  Boolean  @default(true)
  label     String?
  createdAt DateTime @default(now())

  market Market @relation(fields: [marketId], references: [id], onDelete: Cascade)
}
```

**Market Types:** MATCH_WINNER, OVER_UNDER, BOTH_TEAMS_SCORE, DOUBLE_CHANCE, CORRECT_SCORE, HANDICAP

### BetSlip & Bet
Betting slips supporting singles, multi, and system bets.

```prisma
model BetSlip {
  id                String    @id @default(uuid())
  userId            String
  totalStake        Decimal   @db.Decimal(12, 2)
  totalPotentialWin Decimal   @db.Decimal(12, 2)
  betType           BetType
  isPlaced          Boolean   @default(false)
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  user  User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  bets  Bet[]
}

model Bet {
  id          String     @id @default(uuid())
  betSlipId   String
  eventId     String
  marketId    String
  oddsId      String
  oddsValue   Decimal   @db.Decimal(6, 2)
  stake       Decimal   @db.Decimal(12, 2)
  potentialWin Decimal  @db.Decimal(12, 2)
  status      BetStatus @default(PENDING)
  createdAt   DateTime  @default(now())

  betSlip  BetSlip @relation(fields: [betSlipId], references: [id], onDelete: Cascade)
  event   Event   @relation(fields: [eventId], references: [id], onDelete: Cascade)
  market  Market  @relation(fields: [marketId], references: [id], onDelete: Cascade)
  odds    Odds    @relation(fields: [oddsId], references: [id], onDelete: Cascade)
}
```

**Bet Types:** SINGLE, MULTI, SYSTEM

**Bet Status:** PENDING, WON, LOST, CANCELLED

### Crash Games
Betting on crash games (Aviator, JetX, etc.)

```prisma
model CrashGameBet {
  id        String         @id @default(uuid())
  userId    String
  gameType  CrashGameType
  stake     Decimal        @db.Decimal(12, 2)
  cashoutAt Decimal?      @db.Decimal(6, 2)
  payout    Decimal        @db.Decimal(12, 2) @default(0)
  status    BetStatus      @default(PENDING)
  createdAt DateTime       @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Crash Game Types:** AVIATOR, JETX, AVIATRIX, CRASH_COMET, GOAL_PENALTY

### Responsible Gaming
Settings and self-exclusion for responsible gaming.

```prisma
model ResponsibleGamingSettings {
  id                   String   @id @default(uuid())
  userId               String   @unique
  dailyLossLimit       Decimal  @default(100000) @db.Decimal(12, 2)
  monthlyDepositLimit  Decimal  @default(500000) @db.Decimal(12, 2)
  coolDownMinutes      Int      @default(10)
  enableRealityCheck   Boolean  @default(false)
  realityCheckMinutes  Int      @default(60)
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model SelfExclusion {
  id             String   @id @default(uuid())
  userId         String   @unique
  excludedUntil  DateTime?
  isPermanent    Boolean  @default(false)
  createdAt      DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### Referral System
Track referrals and bonuses.

```prisma
model Referral {
  id           String    @id @default(uuid())
  referrerId   String
  referredId   String
  bonusPaid    Boolean   @default(false)
  bonusAmount  Decimal   @db.Decimal(12, 2)
  createdAt    DateTime  @default(now())

  referrer  User @relation("ReferralReferrer", fields: [referrerId], references: [id], onDelete: Cascade)
  referred User @relation("ReferralReferred", fields: [referredId], references: [id], onDelete: Cascade)

  @@unique([referrerId, referredId])
}
```

### Bonus
User bonuses (welcome, referral, deposit bonuses).

```prisma
model Bonus {
  id             String        @id @default(uuid())
  userId         String
  type           BonusType
  amount         Decimal       @db.Decimal(12, 2)
  wageringMultiplier  Int      @default(3)
  wageredAmount  Decimal      @db.Decimal(12, 2) @default(0)
  isActive       Boolean       @default(true)
  expiresAt      DateTime?
  createdAt      DateTime      @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Bonus Types:** WELCOME, REFERRAL, DEPOSIT, FRIDAY

### Compliance
Audit logs for compliance reporting.

```prisma
model AuditLog {
  id        String   @id @default(uuid())
  userId    String?
  action    String
  entity    String?
  entityId  String?
  details   String?
  ipAddress String?
  userAgent String?
  timestamp DateTime @default(now())

  user User? @relation(fields: [userId], references: [id], onDelete: SetNull)
}
```

**Audit Actions:** BET_PLACED, DEPOSIT, WITHDRAWAL, LOGIN_SUCCESS, LOGIN_FAILURE, ODDS_CHANGE, USER_SUSPENDED, LIMIT_CHANGE

### Other Models

**HouseMargin:** Configure house margin per event (default 5%)

**BetLimit:** Set min/max stakes and max exposure per user

**SuspendedUser:** Temporarily suspend users

**Session:** JWT session management

**LiveMatch:** Live match tracking (score, possession, shots, etc.)

## Key Constraints

- All amounts in KES (Decimal 12,2)
- Minimum bet: 1 KES (crash games), 100 KES (withdrawal)
- Minimum deposit: 1 KES
- Age verification required (18+)
- One wallet per user (1:1)
- One self-exclusion per user (1:1)
- Unique referral code per user
- Idempotent transactions (unique reference)

## Relationships

```
User (1) --- (1) Wallet
User (1) --- (N) Transaction
User (1) --- (N) BetSlip
User (1) --- (N) Bet
User (1) --- (N) CrashGameBet
User (1) --- (1) ResponsibleGamingSettings
User (1) --- (1) SelfExclusion
User (1) --- (N) Referral (as referrer)
User (1) --- (N) Referral (as referred)
User (1) --- (N) Bonus
User (1) --- (N) AuditLog
Event (1) --- (N) Market
Market (1) --- (N) Odds
BetSlip (1) --- (N) Bet
```

## Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run migrations (development)
npx prisma migrate dev --name init

# Run migrations (production)
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio
```

## Performance Considerations

- Indexes on: phoneNumber, idNumber, userId (in transactions, bets), eventId (in markets, bets)
- Use `select` to limit fields returned
- Use `include` judiciously (can cause N+1 queries)
- Prisma transaction for ACID compliance (wallet updates, bet placement)
- Redis for caching odds and session data
