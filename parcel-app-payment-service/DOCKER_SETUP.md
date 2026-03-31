# Docker Setup Guide - Parcel Payment Service

## 📦 Overview

This guide explains how to containerize and run the Parcel Payment Service using Docker and Docker Compose.

**Files included:**
- `Dockerfile` - Multi-stage build for the Spring Boot application
- `docker-compose.yml` - Orchestrates Spring Boot service + PostgreSQL database
- `.dockerignore` - Excludes unnecessary files from Docker image

## 🚀 Quick Start

### Prerequisites

- Docker Desktop (includes Docker Engine and Docker Compose)
  - [Download for Windows](https://docs.docker.com/desktop/install/windows-install/)
  - [Download for macOS](https://docs.docker.com/desktop/install/mac-install/)
  - [Download for Linux](https://docs.docker.com/engine/install/)

### 1. Build and Start Services

```bash
# Navigate to project root
cd parcel-app-payment-springboot

# Build Docker image and start both services (PostgreSQL + Spring Boot)
docker-compose up --build

# Or run in detached mode (background)
docker-compose up -d --build
```

**Expected output:**
```
Creating parcel-app-db ... done
Creating parcel-payment-service ... done
```

### 2. Verify Services Are Running

```bash
# Check running containers
docker-compose ps

# View logs
docker-compose logs -f payment-service

# Check database logs
docker-compose logs -f postgres
```

### 3. Test the Application

```bash
# Home page
curl http://localhost:8080/home

# Initialize payment transaction
curl -X POST http://localhost:8080/v1/initializetransaction \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "10000",
    "email": "test@example.com",
    "reference": "ref_123456"
  }'

# Verify payment
curl http://localhost:8080/v1/verifypayment/ref_123456
```

## 🐳 Building Only the Service Image

If you want to build just the Docker image without Docker Compose:

```bash
# Build the image
docker build -t parcel-payment-service:latest .

# Run the container (requires external PostgreSQL)
docker run -d \
  --name payment-service \
  -p 8080:8080 \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://host.docker.internal:5432/parcel_app_db \
  -e SPRING_DATASOURCE_USERNAME=parcel_app_user \
  -e SPRING_DATASOURCE_PASSWORD=parcelapp123 \
  parcel-payment-service:latest
```

## 📝 Docker Compose Configuration

### Environment Variables

The `docker-compose.yml` uses the `.env` file for database credentials:

```env
POSTGRES_DB=parcel_app_db
POSTGRES_USER=parcel_app_user   
POSTGRES_PASSWORD=parcelapp123
```

**To change values:** Edit `.env` and re-run `docker-compose up`.

### Services

#### PostgreSQL (`postgres`)
- **Image:** `postgres:16-alpine`
- **Port:** `5432`
- **Volume:** `postgres_data` (persistent storage)
- **Init Scripts:** Auto-loads `schema.sql` and `data.sql`
- **Health Check:** Verifies database is ready before starting service

#### Spring Boot Service (`payment-service`)
- **Image:** Built from local `Dockerfile`
- **Port:** `8080`
- **Depends On:** PostgreSQL (waits for healthy database)
- **Profile:** Runs with `prod` profile
- **Health Check:** Pings `/home` endpoint every 30 seconds

## 🔧 Common Commands

### Start Services

```bash
# Start in foreground (see logs)
docker-compose up

# Start in background
docker-compose up -d

# Rebuild image before starting
docker-compose up --build

# Start specific service only
docker-compose up postgres
docker-compose up payment-service
```

### Stop Services

```bash
# Stop without removing
docker-compose stop

# Stop and remove containers (keep volumes)
docker-compose down

# Stop, remove, and delete volumes
docker-compose down -v
```

### View Logs

```bash
# All services
docker-compose logs

# Specific service
docker-compose logs payment-service
docker-compose logs postgres

# Follow logs (tail -f)
docker-compose logs -f

# Last 50 lines
docker-compose logs --tail=50
```

### Database Access

```bash
# Connect to PostgreSQL from host
psql -h localhost -U parcel_app_user -d parcel_app_db
# Password: parcelapp123

# Connect from inside container
docker-compose exec postgres psql -U parcel_app_user -d parcel_app_db

# Run SQL query
docker-compose exec postgres psql -U parcel_app_user -d parcel_app_db -c "SELECT * FROM user_payment;"
```

### Application Logs

```bash
# View application startup logs
docker-compose logs payment-service | grep "Started ParcelApplication"

# View database connection logs
docker-compose logs payment-service | grep "jdbc:postgresql"

# Tail application logs
docker-compose logs -f payment-service
```

## 📊 Volume & Persistence

### Database Persistence

Data is stored in the `postgres_data` volume (managed by Docker):

```bash
# View volume information
docker volume inspect parcel-app-payment-springboot_postgres_data

# Backup database
docker-compose exec postgres pg_dump -U parcel_app_user parcel_app_db > backup.sql

# Restore database
docker-compose exec -T postgres psql -U parcel_app_user parcel_app_db < backup.sql

# Delete volume (WARNING: deletes all data)
docker volume rm parcel-app-payment-springboot_postgres_data
```

## 🔐 Security Best Practices

**For Production:**

1. **Change default credentials** in `.env`:
   ```env
   POSTGRES_USER=your_secure_user
   POSTGRES_PASSWORD=$(openssl rand -base64 32)
   ```

2. **Use environment variables** instead of hardcoding:
   ```bash
   docker-compose --env-file .env.prod up -d
   ```

3. **Restrict network access:**
   ```yaml
   # In docker-compose.yml
   postgres:
     ports: []  # Don't expose to host
   payment-service:
     networks:
       - parcel-network  # Only accessible via docker network
   ```

4. **Use secrets** (Docker Swarm/Kubernetes):
   ```yaml
   services:
     postgres:
       environment:
         POSTGRES_PASSWORD_FILE: /run/secrets/db_password
       secrets:
         - db_password
   secrets:
     db_password:
       file: ./secrets/db_password.txt
   ```

5. **Image scanning for vulnerabilities:**
   ```bash
   docker scout cves parcel-payment-service:latest
   ```

## 🐛 Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs payment-service

# Common issues:
# - Database not ready: Wait for postgres health check
# - Port already in use: Change port in docker-compose.yml
# - Out of memory: Increase Docker memory allocation
```

### Database connection refused

```bash
# Verify PostgreSQL is running
docker-compose ps postgres

# Check database logs
docker-compose logs postgres

# Verify credentials in .env and docker-compose.yml match
```

### Schema errors

```bash
# Check schema.sql syntax
docker-compose exec postgres psql -U parcel_app_user -d parcel_app_db -f /docker-entrypoint-initdb.d/01-schema.sql

# View database tables
docker-compose exec postgres psql -U parcel_app_user -d parcel_app_db -c "\dt"
```

### High memory usage

```bash
# Limit service memory
docker-compose exec payment-service java -Xmx512m -Xms256m -jar app.jar

# In docker-compose.yml:
services:
  payment-service:
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
```

## 📈 Scaling & Advanced Usage

### Multi-instance deployment

```yaml
# docker-compose.yml
services:
  payment-service:
    deploy:
      replicas: 3  # Run 3 instances (Swarm mode)
```

### Health-aware restart

```yaml
restart_policy:
  condition: on-failure
  delay: 5s
  max_attempts: 5
  window: 120s
```

### Resource limits

```yaml
services:
  payment-service:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 1G
        reservations:
          cpus: '1'
          memory: 512M
```

## 📚 Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [PostgreSQL Docker Official Image](https://hub.docker.com/_/postgres)
- [Java/OpenJDK Docker Official Image](https://hub.docker.com/_/eclipse-temurin)

## ✅ Checklist

Before deploying to production:

- [ ] Change default PostgreSQL credentials in `.env`
- [ ] Update Spring Boot profiles (`dev`, `prod`)
- [ ] Test API endpoints from inside container
- [ ] Verify database persistence with backup/restore
- [ ] Configure resource limits (CPU, memory)
- [ ] Set up logging and monitoring
- [ ] Test container restart behavior
- [ ] Document any custom environment variables
- [ ] Run security scan on Docker image
- [ ] Set up health checks and alerting

---

**Version:** 1.0  
**Last Updated:** November 2025  
**Maintained By:** Parcel Payment Team
