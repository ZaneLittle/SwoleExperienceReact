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
rsync -av --progress --delete --exclude=node_modules /home/zane/git/SwoleExperience/SwoleExperienceReact/ /mnt/SSD/SwoleExperience/
```

**Option B: Using cp**
```bash
# Copy the files
cp -r ~/git/SwoleExperience/SwoleExperienceReact /mnt/SSD/SwoleExperience

# Remove node_modules
rm -rf /mnt/SSD/SwoleExperience/node_modules

# Sync the drive
sync
```

### Step 3: Build Docker Container in TrueNAS and deploy
1. In TrueNAS, open the shell and navigate to your project:
```bash
cd /mnt/your-pool/SwoleExperience/SwoleExperienceReact
```

2. Build the docker container:
```bash
sudo docker build -t swole-experience-react:latest .
```

3. Restart the app container



## Troubleshooting 
1. logs are stored separately in and can be viewed with:
```bash
# View logs from the container directly
sudo docker-compose logs -f swole-experience-react

# Or access logs inside the running container
sudo docker exec -it swole-experience-react cat /var/log/nginx/access.log
```