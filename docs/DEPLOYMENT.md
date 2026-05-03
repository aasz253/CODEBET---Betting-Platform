# CODEBET Deployment Guide

## Prerequisites
- Node.js v18.19.1
- PostgreSQL 16+
- Redis 7+
- Docker & Docker Compose (for production)
- Domain name with SSL certificate

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/codebet?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this"
JWT_EXPIRES_IN="7d"

# M-Pesa (Safaricom)
MPESA_CONSUMER_KEY="your-mpesa-consumer-key"
MPESA_CONSUMER_SECRET="your-mpesa-consumer-secret"
MPESA_PASSKEY="your-mpesa-passkey"
MPESA_SHORTCODE="174379"
MPESA_CALLBACK_URL="https://your-domain.com/api/wallet/mpesa-callback"

# Age Verification
AGE_VERIFICATION_API_KEY="your-age-verification-api-key"

# Football API
FOOTBALL_API_KEY="your-football-data-api-key"

# Referral & Bonuses
REFERRAL_BONUS_AMOUNT=5000
WELCOME_BONUS_AMOUNT=100
FRIDAY_BONUS_PERCENTAGE=50
FRIDAY_BONUS_MAX=5000

# Admin
ADMIN_PHONE="0722000000"
ADMIN_PASSWORD="admin-secure-password"
```

## Development Setup

1. Install dependencies:
```bash
cd backend && npm install
cd ../frontend && npm install
```

2. Run Prisma migration:
```bash
cd backend
npx prisma migrate dev --name init
```

3. Start development servers:
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

4. Access:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Health check: http://localhost:5000/health

## Production Deployment (Docker)

1. Build and start containers:
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

2. Run database migration:
```bash
docker exec codebet-backend npx prisma migrate deploy
```

3. Access:
- Frontend: https://your-domain.com
- Backend API: https://your-domain.com/api

## Nginx Configuration

SSL certificates should be placed in `/etc/nginx/ssl/`:
- `cert.pem`
- `key.pem`

Security features enabled:
- Rate limiting: 100 req/min/IP (burst 20)
- Security headers (CSP, X-Frame-Options, HSTS)
- SSL/TLS with modern ciphers

## Monitoring

- Health check endpoint: `GET /health`
- UptimeRobot: Monitor `https://your-domain.com/health`
- Logs: `docker logs codebet-backend`

## Backup

PostgreSQL backup:
```bash
docker exec codebet-postgres pg_dump -U postgres codebet > backup_$(date +%Y%m%d).sql
```

Redis backup:
```bash
docker exec codebet-redis redis-cli SAVE
```

## Troubleshooting

1. **Prisma migration fails**: Ensure PostgreSQL is running and DATABASE_URL is correct
2. **Redis connection error**: Check REDIS_URL and Redis container status
3. **CORS errors**: Verify frontend URL in backend CORS config
4. **M-Pesa STK Push fails**: Check API credentials and callback URL
