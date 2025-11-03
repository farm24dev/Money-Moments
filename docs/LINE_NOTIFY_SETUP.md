# การตั้งค่า LINE Official Account (OA)

เพื่อให้ระบบส่งการแจ้งเตือนไปยัง LINE เมื่อมีการฝากเงินสำเร็จ ให้ทำตามขั้นตอนดังนี้:

## ขั้นตอนการตั้งค่า LINE Official Account

### 1. เปิดใช้งาน Messaging API

1. ไปที่ [LINE Official Account Manager](https://manager.line.biz/)
2. เลือกบัญชี Official Account ของคุณ
3. ไปที่ **Settings** > **Messaging API**
4. คลิก **"Enable Messaging API"** (ถ้ายังไม่ได้เปิด)
5. สร้าง Provider และ Channel (หรือเลือกที่มีอยู่แล้ว)

### 2. ดึง Channel Access Token

1. ในหน้า **Messaging API settings**
2. เลื่อนลงไปหาส่วน **"Channel access token"**
3. คลิก **"Issue"** เพื่อสร้าง token ใหม่
4. **คัดลอก Channel Access Token** (เก็บไว้ให้ดี!)

### 3. หา User ID หรือ Group ID

#### วิธีที่ 1: ส่งไปหาผู้ใช้คนเดียว (User ID)
1. เพิ่มเพื่อนกับ Official Account ของคุณ
2. ใช้เครื่องมือเช่น [LINE User ID Finder](https://github.com/kenjiSpecial/line-liff-user-id)
3. หรือใช้ Webhook เพื่อดัก User ID เมื่อมีคนส่งข้อความมา

#### วิธีที่ 2: ส่งไปในกลุ่ม (Group ID) - แนะนำ
1. เชิญ Official Account เข้ากลุ่ม LINE
2. ใช้ Webhook เพื่อดัก Group ID เมื่อบอทเข้ากลุ่ม
3. หรือใช้ LINE Developers Console เพื่อดู Group ID

### 4. ตั้งค่าใน Webhook (ถ้าต้องการหา User/Group ID)

สร้างไฟล์ webhook endpoint ชั่วคราว:

```typescript
// /app/api/line-webhook/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  // Log เพื่อดู User ID หรือ Group ID
  console.log("LINE Webhook Event:", JSON.stringify(body, null, 2));
  
  // ดัก User ID
  if (body.events?.[0]?.source?.userId) {
    console.log("User ID:", body.events[0].source.userId);
  }
  
  // ดัก Group ID
  if (body.events?.[0]?.source?.groupId) {
    console.log("Group ID:", body.events[0].source.groupId);
  }
  
  return NextResponse.json({ status: "ok" });
}
```

ตั้งค่า Webhook URL ใน LINE Developers Console:
- Webhook URL: `https://your-domain.com/api/line-webhook`
- เปิด "Use webhook"

## ตั้งค่าในโปรเจค

เพิ่มค่าต่อไปนี้ใน `.env`:

```env
# Channel Access Token จาก LINE Developers Console
LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token_here

# User ID (สำหรับส่งไปหาผู้ใช้คนเดียว) หรือ Group ID (สำหรับส่งไปในกลุ่ม)
LINE_USER_ID=U1234567890abcdef1234567890abcdef  # สำหรับส่งหาผู้ใช้
# หรือ
LINE_USER_ID=C1234567890abcdef1234567890abcdef  # สำหรับส่งในกลุ่ม (Group ID)
```

**หมายเหตุ:**
- User ID เริ่มต้นด้วย `U`
- Group ID เริ่มต้นด้วย `C`
- Room ID เริ่มต้นด้วย `R`

## การทำงาน

- เมื่อมีการ**ฝากเงิน**สำเร็จ ระบบจะส่งข้อความไปยัง LINE OA โดยอัตโนมัติ
- การเบิกเงินจะ**ไม่ส่งการแจ้งเตือน**
- ข้อมูลที่จะแจ้งเตือน:
  - ชื่อสมาชิก
  - รายการ
  - หมวดหมู่ (ถ้ามี)
  - จำนวนเงิน
  - วันที่ทำรายการ

## ข้อแตกต่างจาก LINE Notify

| คุณสมบัติ | LINE Notify (เก่า) | LINE OA (ใหม่) |
|-----------|-------------------|----------------|
| ราคา | ฟรี | ฟรี (จำกัด 500 ข้อความ/เดือน) |
| การตั้งค่า | ง่าย | ซับซ้อนกว่า |
| ส่งไปกลุ่ม | ได้ | ได้ |
| Rich Message | ไม่ได้ | ได้ (รูปภาพ, carousel, etc.) |
| การตอบกลับ | ไม่ได้ | ได้ (สามารถสร้าง chatbot) |

## การปิดการแจ้งเตือน

หากต้องการปิดการแจ้งเตือน ให้ลบหรือเว้นว่าง `LINE_CHANNEL_ACCESS_TOKEN` ใน `.env`

## แนะนำสำหรับการใช้ในกลุ่ม

1. สร้างกลุ่ม LINE สำหรับทีม
2. เชิญ Official Account เข้ากลุ่ม
3. ใช้ Group ID แทน User ID
4. ทุกคนในกลุ่มจะเห็นการแจ้งเตือน
