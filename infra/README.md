# FND EasyFlow - Docker Infrastructure

This directory contains Docker infrastructure for local development and deployment.

## Services

### PostgreSQL 15
- **Port**: 5432
- **Container**: fnd-postgres
- **Database**: fnd_easyflow
- **User**: fnd_user
- **Password**: fnd_pass

### Redis 7
- **Port**: 6379
- **Container**: fnd-redis
- **Purpose**: Job queue (BullMQ) and caching

### Redis Insight
- **Port**: 8001
- **Container**: fnd-redis-insight
- **URL**: http://localhost:8001
- **Purpose**: Redis GUI for monitoring queues and data

### PgAdmin 4
- **Port**: 5050
- **Container**: fnd-pgadmin
- **URL**: http://localhost:5050
- **Email**: admin@fnd.com
- **Password**: admin

## Usage

### Start All Services

```bash
cd infra
docker-compose up -d
```

### Stop All Services

```bash
cd infra
docker-compose down
```

### Stop and Remove Volumes (Clean Slate)

```bash
cd infra
docker-compose down -v
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f postgres
docker-compose logs -f redis
```

### Check Service Status

```bash
docker-compose ps
```

## Database Connection

After starting the services, update your `.env` file:

```bash
# Local Docker PostgreSQL
DATABASE_URL=postgresql://fnd_user:fnd_pass@localhost:5432/fnd_easyflow

# Local Docker Redis
REDIS_JOBS_URL=redis://localhost:6379
```

## PgAdmin Setup

1. Open http://localhost:5050
2. Login with:
   - Email: admin@fnd.com
   - Password: admin
3. Add Server:
   - Host: postgres (use container name)
   - Port: 5432
   - Database: fnd_easyflow
   - Username: fnd_user
   - Password: fnd_pass

## Redis Insight Setup

1. Open http://localhost:8001
2. Add Redis Database:
   - Host: redis (use container name)
   - Port: 6379
   - Database Alias: FND EasyFlow

## Network

All services run on the `fnd` bridge network, allowing them to communicate using container names.

## Volumes

- `postgres_data`: PostgreSQL data persistence
- `redis_data`: Redis data persistence

## Health Checks

All services include health checks:
- **PostgreSQL**: `pg_isready` check every 10s
- **Redis**: `redis-cli ping` check every 10s

## Troubleshooting

### Port Already in Use

If you get "port already in use" errors, check for existing services:

```bash
# Check PostgreSQL
netstat -an | grep 5432

# Check Redis
netstat -an | grep 6379
```

### Reset Everything

```bash
docker-compose down -v
docker-compose up -d
```

### View Container Logs

```bash
docker logs fnd-postgres
docker logs fnd-redis
```
