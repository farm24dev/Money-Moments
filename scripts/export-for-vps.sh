#!/bin/bash

# Export script for deploying to VPS
# This creates a complete backup package ready for deployment

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
EXPORT_DIR="./export_$TIMESTAMP"
BACKUP_FILE="$EXPORT_DIR/database.sql"

echo "📦 Creating deployment package..."
echo ""

# Create export directory
mkdir -p "$EXPORT_DIR"

# 1. Backup database
echo "1️⃣  Backing up database..."
PGPASSWORD=savings_password pg_dump \
  -h localhost \
  -p 5432 \
  -U savings_user \
  -d savings \
  -F c \
  -f "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "   ✅ Database backed up"
else
    echo "   ❌ Database backup failed!"
    exit 1
fi

# 2. Copy environment template
echo "2️⃣  Creating .env template for VPS..."
cat > "$EXPORT_DIR/.env.example" << 'EOF'
# Database Configuration (Update for VPS)
DATABASE_URL=postgres://savings_user:savings_password@localhost:5432/savings

# Authentication Secret (Generate new one!)
AUTH_SECRET=changeme-super-secret-string

# LINE Notification (Copy from local)
LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token_here
LINE_USER_ID=your_user_or_group_id_here
EOF
echo "   ✅ .env template created"

# 3. Copy current .env (for reference, with sensitive data)
echo "3️⃣  Copying current .env (WARNING: Contains secrets!)..."
if [ -f ".env" ]; then
    cp .env "$EXPORT_DIR/.env.backup"
    echo "   ✅ .env backed up"
fi

# 4. Create deployment instructions
echo "4️⃣  Creating deployment instructions..."
cat > "$EXPORT_DIR/DEPLOY.md" << 'EOF'
# 🚀 Deployment Instructions for VPS

## Prerequisites on VPS

1. **Install Node.js** (v18 or higher)
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **Install PostgreSQL**
   ```bash
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   ```

3. **Install PM2** (for process management)
   ```bash
   sudo npm install -g pm2
   ```

## Step-by-Step Deployment

### 1. Setup Database

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE savings;
CREATE USER savings_user WITH PASSWORD 'your_strong_password_here';
GRANT ALL PRIVILEGES ON DATABASE savings TO savings_user;
\q
```

### 2. Upload Project to VPS

```bash
# On your local machine, from project root
scp -r . user@your-vps-ip:/var/www/money-moments
```

### 3. Restore Database

```bash
# On VPS
cd /var/www/money-moments

# Update credentials in restore script if needed
export DB_PASSWORD=your_strong_password_here

# Restore database
chmod +x scripts/restore.sh
./scripts/restore.sh export_YYYYMMDD_HHMMSS/database.sql
```

### 4. Configure Environment

```bash
# Copy and edit .env file
cp export_YYYYMMDD_HHMMSS/.env.backup .env

# Edit .env with VPS settings
nano .env
```

Update these in `.env`:
- `DATABASE_URL` - Use VPS database credentials
- `AUTH_SECRET` - Generate new secret: `openssl rand -base64 32`
- Keep LINE credentials the same

### 5. Install Dependencies & Build

```bash
npm install
npm run build
```

### 6. Run Prisma Migrations

```bash
npx prisma generate
npx prisma migrate deploy
```

### 7. Start Application

**Option A: Using PM2 (Recommended)**
```bash
pm2 start npm --name "money-moments" -- start
pm2 save
pm2 startup
```

**Option B: Direct**
```bash
npm start
```

### 8. Setup Nginx (Optional but recommended)

```bash
sudo apt install nginx

# Create nginx config
sudo nano /etc/nginx/sites-available/money-moments
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/money-moments /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 9. Setup SSL with Let's Encrypt (Recommended)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 10. Setup LINE Webhook

Update LINE Webhook URL to:
```
https://your-domain.com/api/line-webhook
```

## Monitoring

```bash
# View logs
pm2 logs money-moments

# Monitor
pm2 monit

# Restart
pm2 restart money-moments
```

## Backup on VPS

```bash
# Setup cron job for daily backup
crontab -e

# Add this line (runs at 2 AM daily)
0 2 * * * cd /var/www/money-moments && ./scripts/backup.sh
```

## Troubleshooting

### Database Connection Issues
- Check PostgreSQL is running: `sudo systemctl status postgresql`
- Verify credentials in `.env`
- Check PostgreSQL logs: `sudo tail -f /var/log/postgresql/*.log`

### Application Not Starting
- Check logs: `pm2 logs`
- Verify build: `npm run build`
- Check port 3000 is not in use: `lsof -i :3000`

### LINE Notifications Not Working
- Verify `.env` has correct LINE credentials
- Check webhook URL is publicly accessible
- Test webhook: `curl -X POST https://your-domain.com/api/line-webhook`
EOF
echo "   ✅ Deployment instructions created"

# 5. Create package info
echo "5️⃣  Creating package info..."
cat > "$EXPORT_DIR/PACKAGE_INFO.txt" << EOF
Money Moments - Export Package
Generated: $TIMESTAMP

Contents:
- database.sql         : Database backup
- .env.example        : Environment template for VPS
- .env.backup         : Current environment (contains secrets!)
- DEPLOY.md           : Complete deployment instructions

Next Steps:
1. Upload this entire project to VPS
2. Follow instructions in DEPLOY.md
3. Restore database using database.sql
4. Configure .env for VPS
5. Deploy and run!

⚠️  SECURITY WARNING:
.env.backup contains sensitive credentials!
Delete it after deployment or keep it secure.
EOF
echo "   ✅ Package info created"

# 6. Create archive
echo "6️⃣  Creating compressed archive..."
tar -czf "export_$TIMESTAMP.tar.gz" "$EXPORT_DIR"
echo "   ✅ Archive created: export_$TIMESTAMP.tar.gz"

echo ""
echo "✅ Export package created successfully!"
echo ""
echo "📦 Package location: $EXPORT_DIR/"
echo "📦 Compressed: export_$TIMESTAMP.tar.gz"
echo ""
echo "📋 Contents:"
ls -lh "$EXPORT_DIR"
echo ""
echo "🚀 Next steps:"
echo "1. Upload the entire project to VPS"
echo "2. Follow instructions in $EXPORT_DIR/DEPLOY.md"
echo ""
echo "⚠️  Remember: .env.backup contains sensitive data!"
