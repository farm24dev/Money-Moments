import { NextRequest, NextResponse } from "next/server";

/**
 * LINE Webhook Endpoint
 * 
 * ใช้สำหรับดัก User ID และ Group ID จาก LINE
 * เมื่อได้แล้วให้นำไปใส่ใน .env ที่ LINE_USER_ID
 * 
 * ตั้งค่า Webhook URL ใน LINE Developers Console:
 * https://your-domain.com/api/line-webhook
 */

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        console.log("=== LINE Webhook Event ===");
        console.log(JSON.stringify(body, null, 2));

        // ตรวจสอบ events
        if (body.events && Array.isArray(body.events)) {
            for (const event of body.events) {
                const source = event.source;

                // ดัก User ID (การส่งข้อความ 1-on-1)
                if (source?.userId) {
                    console.log("📱 User ID found:", source.userId);
                    console.log("   👉 ใส่ใน .env: LINE_USER_ID=" + source.userId);
                }

                // ดัก Group ID (การส่งข้อความในกลุ่ม)
                if (source?.groupId) {
                    console.log("👥 Group ID found:", source.groupId);
                    console.log("   👉 ใส่ใน .env: LINE_USER_ID=" + source.groupId);
                }

                // ดัก Room ID (การส่งข้อความในห้อง)
                if (source?.roomId) {
                    console.log("🚪 Room ID found:", source.roomId);
                    console.log("   👉 ใส่ใน .env: LINE_USER_ID=" + source.roomId);
                }

                // แสดงประเภท event
                console.log("Event Type:", event.type);

                // ถ้าเป็นข้อความ แสดงข้อความด้วย
                if (event.type === "message" && event.message?.type === "text") {
                    console.log("Message:", event.message.text);
                }
            }
        }

        console.log("==========================");

        return NextResponse.json({ status: "ok" });
    } catch (error) {
        console.error("Error processing LINE webhook:", error);
        return NextResponse.json(
            { status: "error", message: "Failed to process webhook" },
            { status: 500 }
        );
    }
}

// Verify endpoint (LINE จะเรียกเพื่อตรวจสอบ webhook)
export async function GET() {
    return NextResponse.json({ status: "LINE Webhook is ready" });
}
