# คู่มือ Backup และ Restore ข้อมูล

## การเตรียมการ

### 1. ติดตั้ง PostgreSQL client tools
```bash
# macOS
brew install postgresql

# Ubuntu/Debian
sudo apt-get install postgresql-client
```

### 2. ทำให้สคริปต์รันได้
```bash
chmod +x scripts/backup-db.sh scripts/restore-db.sh
```

## การ Backup ข้อมูล

### Backup ข้อมูลจากเครื่อง Local

```bash
# รันจากโฟลเดอร์โปรเจค
./scripts/backup-db.sh
```

ไฟล์ backup จะถูกบันทึกที่: `backups/backup_YYYYMMDD_HHMMSS.sql.gz`

**ผลลัพธ์:**
```
====================================
🗄️  Database Backup
====================================
Database: savings
Host: localhost:5432
User: savings_user
Backup file: ./backups/backup_20251103_143022.sql
====================================
Starting backup...
✅ Backup completed successfully!
📁 File: ./backups/backup_20251103_143022.sql
📦 Size: 15K

Compressing backup...
✅ Compressed: ./backups/backup_20251103_143022.sql.gz
📦 Compressed size: 3.2K
```

## การ Restore ข้อมูล

### Restore บนเครื่อง Local หรือ VPS

```bash
# ดูไฟล์ backup ที่มี
ls -lh backups/

# Restore จากไฟล์ backup
./scripts/restore-db.sh backups/backup_20251103_143022.sql.gz
```

**คำเตือน:** ⚠️ การ restore จะลบข้อมูลเดิมทั้งหมด!

## การนำขึ้น VPS

### ขั้นตอนที่ 1: Backup จาก Local

```bash
# บนเครื่อง Local
./scripts/backup-db.sh
```

### ขั้นตอนที่ 2: Copy ไฟล์ขึ้น VPS

```bash
# Copy backup file ไปยัง VPS
scp backups/backup_20251103_143022.sql.gz user@your-vps-ip:/path/to/app/backups/

# หรือ copy ทั้งโฟลเดอร์
scp -r backups/ user@your-vps-ip:/path/to/app/
```

### ขั้นตอนที่ 3: Setup Database บน VPS

```bash
# SSH เข้า VPS
ssh user@your-vps-ip

# ไปที่โฟลเดอร์โปรเจค
cd /path/to/app

# ติดตั้ง PostgreSQL (ถ้ายังไม่ได้ติดตั้ง)
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# สร้าง database และ user
sudo -u postgres psql

# ใน PostgreSQL shell:
CREATE USER savings_user WITH PASSWORD 'your_password';
CREATE DATABASE savings OWNER savings_user;
\q
```

### ขั้นตอนที่ 4: Update .env บน VPS

```bash
# แก้ไข .env บน VPS
nano .env

# อัพเดท DATABASE_URL
DATABASE_URL=postgres://savings_user:your_password@localhost:5432/savings
AUTH_SECRET=your_production_secret_here
LINE_CHANNEL_ACCESS_TOKEN=your_token
LINE_USER_ID=your_user_id
```

### ขั้นตอนที่ 5: Restore ข้อมูลบน VPS

```bash
# ทำให้สคริปต์รันได้
chmod +x scripts/restore-db.sh

# Restore ข้อมูล
./scripts/restore-db.sh backups/backup_20251103_143022.sql.gz
```

### ขั้นตอนที่ 6: รัน Migration (ถ้าจำเป็น)

```bash
# ถ้า schema มีการเปลี่ยนแปลง
npx prisma migrate deploy
```

## การ Backup อัตโนมัติบน VPS

### สร้าง Cron Job สำหรับ Backup ทุกวัน

```bash
# แก้ไข crontab
crontab -e

# เพิ่มบรรทัดนี้ (backup ทุกวันเวลา 2:00 น.)
0 2 * * * cd /path/to/app && ./scripts/backup-db.sh >> /var/log/backup.log 2>&1

# หรือ backup ทุก 6 ชั่วโมง
0 */6 * * * cd /path/to/app && ./scripts/backup-db.sh >> /var/log/backup.log 2>&1
```

### ลบ Backup เก่าอัตโนมัติ (เก็บไว้ 7 วัน)

```bash
# เพิ่มใน crontab
0 3 * * * find /path/to/app/backups -name "*.gz" -mtime +7 -delete
```

## การทดสอบ

### 1. ทดสอบ Backup
```bash
./scripts/backup-db.sh
# ตรวจสอบว่ามีไฟล์ใน backups/
ls -lh backups/
```

### 2. ทดสอบ Restore (ระวัง!)
```bash
# Backup ข้อมูลปัจจุบันก่อน
./scripts/backup-db.sh

# ทดสอบ restore
./scripts/restore-db.sh backups/backup_latest.sql.gz

# ตรวจสอบข้อมูล
npm run dev
# เปิดเว็บและตรวจสอบข้อมูล
```

## Tips & Best Practices

### 🔒 ความปลอดภัย
- **อย่า commit** ไฟล์ backup ขึ้น git
- เพิ่ม `backups/` ใน `.gitignore`
- ใช้รหัสผ่านที่แข็งแรงบน production
- เก็บ backup ไว้หลายที่ (local + cloud storage)

### 📦 การจัดการ Backup
- เก็บ backup ไว้อย่างน้อย 7-30 วัน
- Backup ก่อนทำการอัพเดทระบบทุกครั้ง
- ทดสอบ restore เป็นประจำ

### ☁️ Cloud Backup (แนะนำ)
```bash
# Upload ไป S3
aws s3 cp backups/backup_20251103_143022.sql.gz s3://your-bucket/backups/

# หรือ Google Cloud Storage
gsutil cp backups/backup_20251103_143022.sql.gz gs://your-bucket/backups/
```

## การแก้ปัญหา

### ไม่สามารถเชื่อมต่อ Database
```bash
# ตรวจสอบว่า PostgreSQL กำลังรันอยู่
sudo systemctl status postgresql

# เริ่ม PostgreSQL
sudo systemctl start postgresql
```

### Permission denied
```bash
# ตรวจสอบสิทธิ์
ls -la scripts/

# แก้ไขสิทธิ์
chmod +x scripts/*.sh
```

### Database ไม่มี
```bash
# สร้าง database ใหม่
sudo -u postgres createdb savings
sudo -u postgres createuser savings_user
```

## สรุป Commands

```bash
# Backup
./scripts/backup-db.sh

# ดู backups ที่มี
ls -lh backups/

# Restore
./scripts/restore-db.sh backups/backup_YYYYMMDD_HHMMSS.sql.gz

# Copy ไป VPS
scp backups/backup_latest.sql.gz user@vps:/path/to/app/backups/

# SSH เข้า VPS
ssh user@your-vps-ip

# Restore บน VPS
cd /path/to/app
./scripts/restore-db.sh backups/backup_latest.sql.gz
```
