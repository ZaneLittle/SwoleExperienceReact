# Modi Deployment Guide

This guide covers deploying Modi (backend API) to TrueNAS Scale with PostgreSQL and Redis.

## Prerequisites

- TrueNAS Scale with Docker/container support
- SMB share mounted for project files
- Access to TrueNAS shell

## Building and Deploying

### Step 1: Mount SMB Share
Ensure the SMB for the app is mounted:
```bash
sudo mount -t cifs -o credentials=~/.smb_creds,vers=3.0,uid=$(id -u),gid=$(id -g),rw,file_mode=0777,dir_mode=0777,sync //<server_ip>/SwoleExperience /mnt/SSD/SwoleExperience
```
**Note**: The `~/.smb_creds` file must contain your user's `username` and `password`.

### Step 2: Copy Project Files
**Option A: Using rsync (Recommended)**
```bash
rsync -av --progress --delete --exclude=tmp --exclude=.air.toml /home/zane/git/SwoleExperienceReact/modi/ /mnt/SSD/SwoleExperience/modi/
```

**Option B: Using cp**
```bash
# Copy the files
cp -r ~/git/SwoleExperienceReact/modi /mnt/SSD/SwoleExperience/

# Remove development files
rm -rf /mnt/SSD/SwoleExperience/modi/tmp
rm -f /mnt/SSD/SwoleExperience/modi/.air.toml

# Sync the drive
sync
```

### Step 3: Create Production .env File
On TrueNAS, create a production `.env` file:
```bash
cd /mnt/your-pool/SwoleExperience/modi
cp .env.example .env
```

Edit `.env` with production values:
```bash
PORT=8080
ENV=production
DATABASE_URL=postgres://postgres:your-secure-password@postgres:5432/modi?sslmode=disable
REDIS_URL=redis://redis:6379
JWT_SECRET=your-production-secret-key-here
LOG_LEVEL=info
```

**Important**: 
- Use strong passwords for `POSTGRES_PASSWORD` and `JWT_SECRET`
- The `DATABASE_URL` uses `postgres` as hostname (container name)
- The `REDIS_URL` uses `redis` as hostname (container name)

### Step 4: Build and Deploy with Docker Compose
1. In TrueNAS, open the shell and navigate to your project:
```bash
cd /mnt/your-pool/SwoleExperience/modi
```

2. Build and start all services:
```bash
sudo docker-compose up -d --build
```

This will:
- Build the Modi API Docker image
- Pull PostgreSQL and Redis images
- Start all three containers
- Set up networking between containers
- Create persistent volumes for database and Redis data

3. Verify containers are running:
```bash
sudo docker-compose ps
```

You should see all three services: `modi-api`, `modi-postgres`, and `modi-redis`

4. Check logs:
```bash
# View all logs
sudo docker-compose logs -f

# View specific service logs
sudo docker-compose logs -f api
sudo docker-compose logs -f postgres
sudo docker-compose logs -f redis
```

### Step 5: Test the Deployment
```bash
# Test health check
curl http://localhost:8080/health

# Or from another machine (replace with TrueNAS IP)
curl http://<truenas-ip>:8080/health
```

## Managing the Deployment

### Stopping Services
```bash
cd /mnt/your-pool/SwoleExperience/modi
sudo docker-compose down
```

### Starting Services
```bash
sudo docker-compose up -d
```

### Restarting Services
```bash
# Restart all services
sudo docker-compose restart

# Restart specific service
sudo docker-compose restart api
```

### Updating the Deployment
After making code changes:
1. Copy updated files to TrueNAS (Step 2)
2. Rebuild and restart:
   ```bash
   cd /mnt/your-pool/SwoleExperience/modi
   sudo docker-compose up -d --build
   ```

## Database Migrations

Run database migrations manually (when migrations are implemented):
```bash
# Access PostgreSQL container
sudo docker exec -it modi-postgres psql -U postgres -d modi

# Or run migrations from API container (when migration tooling is added)
sudo docker exec -it modi-api /path/to/migration/command
```

## Backup and Restore

### Backup PostgreSQL Database
```bash
# Create backup
sudo docker exec modi-postgres pg_dump -U postgres modi > backup_$(date +%Y%m%d_%H%M%S).sql

# Or backup to a file on the host
sudo docker exec modi-postgres pg_dump -U postgres modi | gzip > /mnt/backup/modi_backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Restore PostgreSQL Database
```bash
# Restore from backup
sudo docker exec -i modi-postgres psql -U postgres modi < backup_file.sql

# Or from compressed backup
gunzip < backup_file.sql.gz | sudo docker exec -i modi-postgres psql -U postgres modi
```

### Backup Redis Data
Redis data is persisted in the `redis_data` volume. The volume location can be found with:
```bash
sudo docker volume inspect modi_redis_data
```

## Troubleshooting

### View Logs
```bash
# View all logs
sudo docker-compose logs -f

# View specific service logs
sudo docker-compose logs -f api
sudo docker-compose logs -f postgres
sudo docker-compose logs -f redis

# View last 100 lines
sudo docker-compose logs --tail=100 api
```

### Check Container Status
```bash
# Check all containers
sudo docker-compose ps

# Check container health
sudo docker ps
```

### Access Container Shell
```bash
# API container
sudo docker exec -it modi-api sh

# PostgreSQL container
sudo docker exec -it modi-postgres psql -U postgres -d modi

# Redis container
sudo docker exec -it modi-redis redis-cli
```

### Database Connection Issues
```bash
# Test PostgreSQL connection from API container
sudo docker exec -it modi-api sh -c 'echo $DATABASE_URL'

# Test PostgreSQL from host
sudo docker exec -it modi-postgres psql -U postgres -d modi -c "SELECT 1;"
```

### Redis Connection Issues
```bash
# Test Redis connection
sudo docker exec -it modi-redis redis-cli ping

# Should return: PONG
```

### Rebuild After Code Changes
```bash
# Force rebuild without cache
sudo docker-compose build --no-cache api
sudo docker-compose up -d
```

### View Container Resource Usage
```bash
sudo docker stats modi-api modi-postgres modi-redis
```

## Environment Variables

Create a `.env` file in the modi directory with these variables:
```bash
PORT=8080
ENV=production
DATABASE_URL=postgres://postgres:password@postgres:5432/modi?sslmode=disable
REDIS_URL=redis://redis:6379
JWT_SECRET=your-secret-key
LOG_LEVEL=info
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-secure-password
```

## Persistent Data

The following data is persisted in Docker volumes:
- **PostgreSQL data**: `postgres_data` volume
- **Redis data**: `redis_data` volume

To backup volumes:
```bash
# List volumes
sudo docker volume ls

# Inspect volume location
sudo docker volume inspect modi_postgres_data
sudo docker volume inspect modi_redis_data
```

## Network Configuration

All containers are on the `modi-network` bridge network, allowing them to communicate using service names:
- API connects to PostgreSQL using hostname: `postgres`
- API connects to Redis using hostname: `redis`

External access:
- API: `http://<truenas-ip>:8080`
- PostgreSQL: Only accessible from within Docker network (or exposed port 5432 on host)
- Redis: Only accessible from within Docker network (or exposed port 6379 on host)

