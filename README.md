# CODEBET - Deployment Guide

## Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)
- PostgreSQL 16+ (for local development)
- Redis 7+ (for local development)

## Environment Setup

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update the following variables in `.env`:
- `JWT_SECRET`: Generate with `openssl rand -base64 32`
- `MPESA_*`: Get from Safaricom Developer Portal
- `AGE_VERIFICATION_API_KEY`: Get from your age verification provider
- `DATABASE_URL`: Update with your database credentials

## Local Development

### Option 1: Run with Docker Compose
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Option 2: Run locally without Docker

**Backend:**
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Production Deployment

### Using Docker Compose (Recommended)

1. Clone the repository on your server:
```bash
git clone https://github.com/yourusername/codebet.git
cd codebet
```

2. Create `.env` file with production values

3. Start services:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

4. Run database migrations:
```bash
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

### SSL/TLS Setup

1. Place your SSL certificates in the `ssl/` directory:
   - `ssl/fullchain.pem`
   - `ssl/privkey.pem`

2. Update `nginx.conf` server_name with your domain

3. Restart nginx:
```bash
docker-compose -f docker-compose.prod.yml restart nginx
```

## GitHub Actions Deployment

The workflow in `.github/workflows/deploy.yml` automatically:
1. Runs tests and linters on every push/PR
2. Builds Docker images on push to main branch
3. Pushes images to Docker Hub
4. Deploys to server via SSH

### Required Secrets

Add these secrets in your GitHub repository settings:

- `DOCKER_USERNAME`: Your Docker Hub username
- `DOCKER_PASSWORD`: Your Docker Hub password/token
- `SERVER_HOST`: Your production server IP/hostname
- `SERVER_USER`: SSH username
- `SERVER_SSH_KEY`: SSH private key for deployment

## Rate Limiting

The nginx reverse proxy limits requests to:
- 100 requests per minute per IP
- Burst capacity: 20 requests

## Security Headers

Configured in `nginx.conf`:
- `X-Frame-Options: SAMEORIGIN`
- `Strict-Transport-Security: max-age=31536000`
- `Content-Security-Policy`: Restricts resource loading
- `X-Content-Type-Options: nosniff`

## Monitoring

Check service status:
```bash
docker-compose -f docker-compose.prod.yml ps
```

View logs:
```bash
docker-compose -f docker-compose.prod.yml logs -f [service-name]
```

## Troubleshooting

**Database connection issues:**
```bash
docker-compose -f docker-compose.prod.yml exec postgres pg_isready -U codebet
```

**Redis connection issues:**
```bash
docker-compose -f docker-compose.prod.yml exec redis redis-cli ping
```

**Backend logs:**
```bash
docker-compose -f docker-compose.prod.yml logs -f backend
```
