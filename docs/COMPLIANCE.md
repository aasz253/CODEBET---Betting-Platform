# CODEBET Compliance Documentation

## Overview
CODEBET is a betting platform operating in Kenya, subject to Betting Control and Licensing Board (BCLB) regulations. This document outlines compliance features implemented in the platform.

## Regulatory Requirements

### 1. Age Verification (18+ Only)
- **Implementation:** Phone number-based age verification via Safaricom API (mocked in dev)
- **Fallback:** Manual date of birth confirmation
- **Enforcement:** Registration blocked if age < 18 years
- **Code:** `backend/src/services/ageVerification.ts`

### 2. Responsible Gaming

#### Daily Loss Limit
- **Default:** 100,000 KES
- **Policy:** Users can only lower the limit, never increase
- **Enforcement:** Checked before each bet placement
- **Code:** `backend/src/middleware/responsibleGaming.ts`

#### Monthly Deposit Limit
- **Default:** 500,000 KES
- **Policy:** Users can only lower the limit
- **Enforcement:** Checked on deposit

#### Self-Exclusion
- **Options:** 24 hours, 7 days, or permanent
- **Effect:** User cannot login or place bets during exclusion
- **Code:** `backend/src/models/SelfExclusion`

#### Cool-Down
- **Default:** 10 minutes between bets
- **User-configurable:** Can be increased, not decreased

#### Reality Check
- **Default:** Every 60 minutes
- **Display:** Popup showing time played and total spent
- **User-configurable:** Can enable/disable

#### Age Warning
- **Trigger:** On first login if user is 18-21 years old
- **Action:** Must acknowledge warning before continuing

### 3. Audit Trail (Immutable)

#### Audit Log Model
All critical actions logged with:
- User ID
- Action type
- Entity affected
- Entity ID
- Details (JSON)
- IP address
- User agent
- Timestamp

#### Logged Actions
- `BET_PLACED` - Bet placement with stake, odds, potential win
- `DEPOSIT` - Money deposit with amount, method
- `WITHDRAWAL` - Money withdrawal with amount, destination
- `LOGIN_SUCCESS` - Successful login with IP
- `LOGIN_FAILURE` - Failed login attempt
- `ODDS_CHANGE` - Odds update by admin
- `USER_SUSPENDED` - User suspension by admin
- `LIMIT_CHANGE` - Responsible gaming limit change

#### Audit Log Access
- **Admin only:** `GET /compliance/audit-logs`
- **Filters:** Date range, user ID, action type, entity
- **Export:** CSV and JSON formats
- **Retention:** Immutable, never deleted

### 4. Financial Reporting

#### Daily Summary (for BCLB)
- **Endpoint:** `GET /compliance/daily-summary?date=YYYY-MM-DD`
- **Data:**
  - Total bets placed
  - Total stakes (KES)
  - House profit (5% margin)
  - Total transactions
  - Payouts made

#### Responsible Gaming Report
- **Endpoint:** `GET /compliance/responsible-gaming-report`
- **Data:**
  - Self-excluded users (count, details)
  - Users with active limits
  - Suspended users

#### Regulatory Report Submission
- **Endpoint:** `POST /compliance/send-report`
- **Format:** PDF/CSV sent to regulator email
- **Frequency:** As required by BCLB

### 5. Data Protection (Kenya Data Protection Act 2019)

#### User Rights
- **Access:** Users can view their data (profile, transactions, bets)
- **Portability:** Export data in JSON format (not yet implemented)
- **Deletion:** Account deletion with 30-day cooling period (not yet implemented)

#### Data Minimization
- Only collect necessary data (phone, ID, DOB)
- No unnecessary personal information stored

#### Encryption
- Passwords: bcrypt hashed (not plain text)
- JWT secrets: Stored in environment variables
- Database: PostgreSQL with encrypted connections (configure in production)

### 6. Anti-Money Laundering (AML)

#### Transaction Monitoring
- Large deposits flagged (threshold: 500,000 KES)
- Frequent deposits flagged (threshold: 10 per day)
- Large withdrawals flagged (threshold: 200,000 KES)

#### Suspicious Activity Reporting
- Admin can flag suspicious accounts
- Suspended users cannot transact
- Audit trail for all actions

### 7. Fair Gaming

#### Provably Fair Algorithm (Crash Games)
- **Algorithm:** `multiplier = Math.exp(random * Math.log(1000))`
- **Random source:** Node.js crypto.randomBytes
- **Verification:** Clients can verify crash point
- **Code:** `backend/src/services/aviatorService.ts`

#### Odds Integrity
- Only admins can change odds
- All odds changes logged in audit trail
- No modification of historical odds allowed

### 8. Tax Compliance

#### Withholding Tax
- **Rate:** 20% on winnings (as per Kenyan law)
- **Implementation:** Deducted automatically on cashout (not yet implemented)
- **Reporting:** Monthly tax reports to KRA (not yet implemented)

### 9. Technical Compliance

#### High Availability
- **Health check:** `GET /health` (database + Redis status)
- **Monitoring:** UptimeRobot free tier (recommended)
- **Backups:** Daily PostgreSQL backups (automated via cron)

#### Security
- **HTTPS:** SSL/TLS via Nginx (SSL-ready config provided)
- **Rate limiting:** 100 req/min/IP (burst 20)
- **Security headers:** CSP, X-Frame-Options, HSTS
- **DDoS protection:** Cloudflare free tier (recommended)

#### Disaster Recovery
- **Database:** Point-in-time recovery (PostgreSQL WAL)
- **Redis:** AOF persistence enabled
- **Backups:** Stored offsite (S3 or similar)

### 10. Compliance Checklist

#### Pre-Launch
- [ ] Register with BCLB and obtain license
- [ ] Implement KRA tax withholding
- [ ] Set up automated regulatory reports
- [ ] Conduct penetration testing
- [ ] Review data protection compliance
- [ ] Set up monitoring and alerting
- [ ] Test disaster recovery procedures
- [ ] Train staff on responsible gaming
- [ ] Prepare compliance manuals

#### Post-Launch
- [ ] Monthly BCLB reports submitted
- [ ] Quarterly tax returns filed
- [ ] Annual data protection audit
- [ ] Review and update responsible gaming limits
- [ ] Monitor suspicious activity
- [ ] Test backup restoration
- [ ] Update compliance documentation

## Penalties for Non-Compliance

### BCLB Fines
- Operating without license: Up to 1,000,000 KES
- Allowing underage gambling: Up to 500,000 KES per incident
- Failing to submit reports: Up to 100,000 KES per report

### Data Protection Fines
- Up to 3,000,000 KES or 1% of annual turnover

## Contact Information

### Regulators
- **BCLB:** bettingcontrol.go.ke
- **Office of Data Protection:** odpc.go.ke
- **KRA:** kra.go.ke

### Internal
- **Compliance Officer:** (to be appointed)
- **Responsible Gaming Email:** responsible@codebet.co.ke
- **Complaints Email:** complaints@codebet.co.ke

## Code References

- Age verification: `backend/src/services/ageVerification.ts`
- Responsible gaming settings: `backend/src/models/ResponsibleGamingSettings.ts`
- Self-exclusion: `backend/src/models/SelfExclusion.ts`
- Audit logging: `backend/src/middleware/auditLog.ts`
- Compliance endpoints: `backend/src/routes/complianceRoutes.ts`
- Admin suspension: `backend/src/routes/adminRoutes.ts`
