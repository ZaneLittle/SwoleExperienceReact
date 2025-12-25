# Magni Deployment Guide

This guide covers deploying Magni (frontend) to TrueNAS Scale.

## Building the Docker Container

### Step 1: Mount SMB Share
Ensure the SMB for the app is mounted:
```bash
sudo mount -t cifs -o credentials=~/.smb_creds,vers=3.0,uid=$(id -u),gid=$(id -g),rw,file_mode=0777,dir_mode=0777,sync //<server_ip>/SwoleExperience /mnt/SSD/SwoleExperience
```
**Note**: The `~/.smb_creds` file must contain your user's `username` and `password`.

### Step 2: Copy Project Files
**Option A: Using rsync (Recommended)**
```bash
rsync -av --progress --delete --exclude=node_modules /home/zane/git/SwoleExperienceReact/magni/ /mnt/SSD/SwoleExperience/magni/
```

**Option B: Using cp**
```bash
# Copy the files
cp -r ~/git/SwoleExperienceReact/magni /mnt/SSD/SwoleExperience

# Remove node_modules
rm -rf /mnt/SSD/SwoleExperience/magni/node_modules

# Sync the drive
sync
```

### Step 3: Build Docker Container in TrueNAS and deploy
1. In TrueNAS, open the shell and navigate to your project:
```bash
cd /mnt/your-pool/SwoleExperience/magni
```

2. Build and start the container using Docker Compose:
```bash
sudo docker-compose up -d --build
```

**Or build manually:**
```bash
sudo docker build -t magni:latest .
sudo docker-compose up -d
```

3. Verify the container is running:
```bash
sudo docker-compose ps
```



## Troubleshooting 

### View Logs
```bash
# View logs from the container directly
sudo docker-compose logs -f magni

# Or access logs inside the running container
sudo docker exec -it magni cat /var/log/nginx/access.log
```

### Container Management
```bash
# Stop the container
sudo docker-compose down

# Start the container
sudo docker-compose up -d

# Restart the container
sudo docker-compose restart magni

# View container status
sudo docker-compose ps
```

### Rebuild After Code Changes
```bash
cd /mnt/your-pool/SwoleExperience/magni
sudo docker-compose up -d --build
```