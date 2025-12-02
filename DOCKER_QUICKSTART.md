# Docker Quick Start Guide

Get FlowDocs running with Docker in minutes.

## Prerequisites

- Docker Desktop or Docker Engine installed
- Docker Compose v2.0+

## Quick Start

1. **Copy environment file:**
   ```bash
   cp .env.docker .env
   ```

2. **Generate secure auth secret:**
   ```bash
   openssl rand -hex 32
   ```
   Copy the output and update `BETTER_AUTH_SECRET` in `.env`

3. **Start all services:**
   ```bash
   docker-compose up -d
   ```

4. **Check service status:**
   ```bash
   docker-compose ps
   ```

5. **View logs:**
   ```bash
   docker-compose logs -f app
   ```

6. **Access the application:**
   Open [http://localhost:3000](http://localhost:3000)

## Scaling

Scale the application to 3 replicas:
```bash
docker-compose up -d --scale app=3
```

Check running instances:
```bash
docker-compose ps app
```

## Database Management

Run Prisma migrations:
```bash
docker-compose exec app npx prisma migrate deploy
```

Access Prisma Studio:
```bash
docker-compose exec app npx prisma studio
```

Connect to PostgreSQL:
```bash
docker-compose exec postgres psql -U postgres -d flowdocs
```

## Stopping Services

Stop all services:
```bash
docker-compose down
```

Stop and remove volumes (⚠️ deletes all data):
```bash
docker-compose down -v
```

## Troubleshooting

### Build fails with "Prisma Schema not found"
Ensure `prisma/schema.prisma` exists in your project.

### Port 3000 already in use
Change the port mapping in `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Use port 3001 instead
```

### Database connection errors
Check that PostgreSQL is healthy:
```bash
docker-compose ps postgres
docker-compose logs postgres
```

### Application won't start
Check application logs:
```bash
docker-compose logs app
```

Rebuild the image:
```bash
docker-compose build --no-cache app
docker-compose up -d
```

### Out of memory errors
Increase Docker Desktop memory allocation:
- Docker Desktop → Settings → Resources → Memory
- Recommended: 4GB minimum

## Production Deployment

For production, update `.env`:

1. **Set secure secrets:**
   ```bash
   BETTER_AUTH_SECRET=$(openssl rand -hex 32)
   POSTGRES_PASSWORD=$(openssl rand -hex 32)
   ```

2. **Update URLs:**
   ```bash
   NEXT_PUBLIC_APP_URL=https://your-domain.com
   BETTER_AUTH_URL=https://your-domain.com/api/auth
   ```

3. **Configure OAuth providers:**
   Add your Google OAuth credentials (or other providers)

4. **Set up email:**
   Add Resend API key for transactional emails

5. **Deploy with proper resource limits:**
   The docker-compose.yml already includes production-ready resource limits

## Monitoring

View resource usage:
```bash
docker stats
```

Check health status:
```bash
docker-compose ps
```

View all logs:
```bash
docker-compose logs -f
```

## Backup

Backup PostgreSQL database:
```bash
docker-compose exec postgres pg_dump -U postgres flowdocs > backup.sql
```

Restore from backup:
```bash
cat backup.sql | docker-compose exec -T postgres psql -U postgres flowdocs
```

## Next Steps

- Configure auto-scaling (see [AUTOSCALING.md](./AUTOSCALING.md))
- Set up monitoring and alerting
- Configure CI/CD pipeline
- Review security best practices
