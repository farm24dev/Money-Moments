# ระบบบันทึกการออมเงิน

เว็บสำหรับบันทึกยอดออมของแต่ละคน แสดงสรุปยอดรวม และดูประวัติการฝากล่าสุด สร้างด้วย Next.js และ PostgreSQL โดยจัดเตรียม Docker Compose เพื่อใช้งานได้ทันที พร้อมระบบยืนยันตัวตนสำหรับผู้ใช้งานแต่ละคน

## คุณสมบัติ

- เพิ่มรายชื่อสมาชิกที่ต้องการติดตามการออม
- บันทึกยอดออม พร้อมรายละเอียดและจำนวนเงินสำหรับแต่ละคน
- แสดงยอดรวมทั้งหมด, จัดอันดับผู้ที่ออมสูงสุด และรายการฝากล่าสุด
- ระบบเข้าสู่ระบบ/สมัครสมาชิกด้วยอีเมลและรหัสผ่าน เก็บ session ผ่าน Prisma

## เตรียมสภาพแวดล้อม

1. ติดตั้ง Node.js 20+ และ Docker (พร้อม Docker Compose)
2. คัดลอกไฟล์ตัวอย่างตัวแปรสภาพแวดล้อม

   ```bash
   cp .env.example .env
   ```

   จากนั้นปรับค่า `DATABASE_URL` และตั้ง `AUTH_SECRET` ให้เป็นสตริงที่สุ่มและปลอดภัย (อย่างน้อย 32 ตัวอักษร)

3. หากต้องการใช้งานฐานข้อมูลนอกเหนือจาก Docker Compose ให้รันสคริปต์ `docker/init.sql` ในฐานข้อมูล PostgreSQL ของคุณเพื่อสร้างตารางที่จำเป็น

## รันด้วย Docker Compose

```bash
docker compose up --build
```

- ฐานข้อมูลจะพร้อมใช้งานที่ `postgres://savings_user:savings_password@localhost:5432/savings`
- แอปรันที่ [http://localhost:3000](http://localhost:3000)
- เมื่อปิดใช้งานให้กด `Ctrl+C` แล้วตามด้วย `docker compose down`

## การพัฒนาแบบโลคัล (ไม่ใช้ Docker)

1. ติดตั้ง dependency

   ```bash
   npm install
   ```

2. สร้างฐานข้อมูลและตารางตามไฟล์ `docker/init.sql`

3. ตั้งค่า `DATABASE_URL` และ `AUTH_SECRET` ใน `.env`

4. (ครั้งแรกหลังแก้ schema) สร้าง Prisma Client

   ```bash
   npm run prisma:generate
   ```

5. รันเซิร์ฟเวอร์พัฒนา

   ```bash
   npm run dev
   ```

## สคริปต์ที่ใช้บ่อย

- `npm run dev` – รันเซิร์ฟเวอร์ Next.js โหมดพัฒนา
- `npm run build` – สร้างไฟล์พร้อมใช้งานจริง
- `npm run start` – รันเซิร์ฟเวอร์พร้อมใช้งานจริงหลัง build
- `npm run lint` – ตรวจสอบคุณภาพโค้ดด้วย ESLint
- `npm run prisma:generate` – สร้าง Prisma Client ตาม schema ปัจจุบัน
- `npm run prisma:migrate:deploy` – ใช้ชุด migration (หากมี) กับฐานข้อมูลปลายทาง

## โครงสร้างฐานข้อมูล

- `User` – เก็บข้อมูลผู้ใช้สำหรับเข้าสู่ระบบ
- `Person` – เก็บข้อมูลสมาชิก (ชื่อและเวลาที่สร้าง) ผูกกับผู้ใช้แต่ละคน
- `SavingEntry` – เก็บประวัติการออมของแต่ละคน พร้อมจำนวนเงินและเวลาบันทึก
- `Session` – จัดเก็บ session token ที่เข้ารหัส

ไฟล์ `docker/init.sql` จะสร้างตารางพร้อม index ที่จำเป็นโดยอัตโนมัติเมื่อรันผ่าน Docker Compose
