# Database Scripts

สคริปต์สำหรับจัดการฐานข้อมูล PostgreSQL

## สคริปต์ที่มี

### 1. backup-db.sh
Backup ฐานข้อมูลและบีบอัดไฟล์

**การใช้งาน:**
```bash
./scripts/backup-db.sh
```

**ผลลัพธ์:**
- สร้างไฟล์ backup ใน `backups/backup_YYYYMMDD_HHMMSS.sql.gz`
- แสดงขนาดไฟล์และรายการ backup ล่าสุด

### 2. restore-db.sh
Restore ฐานข้อมูลจากไฟล์ backup

**การใช้งาน:**
```bash
./scripts/restore-db.sh backups/backup_20251103_143022.sql.gz
```

**คำเตือน:** 
- จะลบข้อมูลเดิมทั้งหมด
- ต้องยืนยันก่อน restore

## การเตรียมการ

1. ติดตั้ง PostgreSQL client:
```bash
# macOS
brew install postgresql

# Ubuntu/Debian  
sudo apt-get install postgresql-client
```

2. ให้สิทธิ์รันสคริปต์:
```bash
chmod +x scripts/*.sh
```

3. ตรวจสอบไฟล์ `.env` มี `DATABASE_URL` ถูกต้อง

## ดูเอกสารเพิ่มเติม

อ่านคู่มือฉบับเต็มที่: [docs/BACKUP_RESTORE.md](../docs/BACKUP_RESTORE.md)
