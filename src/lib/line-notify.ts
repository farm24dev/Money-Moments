const LINE_MESSAGING_API = "https://api.line.me/v2/bot/message/push";

type LineSendMessageParams = {
    message: string;
    userId?: string;
    channelAccessToken?: string;
};

export async function sendLineMessage({
    message,
    userId,
    channelAccessToken,
}: LineSendMessageParams): Promise<boolean> {
    const accessToken = channelAccessToken || process.env.LINE_CHANNEL_ACCESS_TOKEN;
    const targetUserId = userId || process.env.LINE_USER_ID;

    if (!accessToken) {
        console.warn("LINE_CHANNEL_ACCESS_TOKEN is not configured");
        return false;
    }

    if (!targetUserId) {
        console.warn("LINE_USER_ID is not configured");
        return false;
    }

    try {
        const response = await fetch(LINE_MESSAGING_API, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
                to: targetUserId,
                messages: [
                    {
                        type: "text",
                        text: message,
                    },
                ],
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Failed to send LINE message:", errorText);
            return false;
        }

        return true;
    } catch (error) {
        console.error("Error sending LINE message:", error);
        return false;
    }
} type NotifyDepositParams = {
    personName: string;
    amount: number;
    label: string;
    categoryName?: string | null;
    transactionDate: Date;
    balance: number;
};

export async function notifyDeposit({
    personName,
    amount,
    label,
    categoryName,
    transactionDate,
    balance,
}: NotifyDepositParams): Promise<boolean> {
    const formatter = new Intl.NumberFormat("th-TH", {
        style: "currency",
        currency: "THB",
        minimumFractionDigits: 2,
    });

    const dateFormatter = new Intl.DateTimeFormat("th-TH", {
        dateStyle: "medium",
        timeStyle: "short",
    });

    const categoryText = categoryName ? `\nหมวดหมู่: ${categoryName}` : "";

    const message = `
💰 มีการฝากเงินใหม่!

👤 สมาชิก: ${personName}
📝 รายการ: ${label}${categoryText}
💵 จำนวน: ${formatter.format(amount)}
📅 วันที่: ${dateFormatter.format(transactionDate)}
━━━━━━━━━━━━━━━━━━
💼 ยอดคงเหลือ: ${formatter.format(balance)}
  `.trim();

    return sendLineMessage({ message });
}

type NotifyWithdrawParams = {
    personName: string;
    amount: number;
    label: string;
    categoryName?: string | null;
    transactionDate: Date;
    balance: number;
};

export async function notifyWithdraw({
    personName,
    amount,
    label,
    categoryName,
    transactionDate,
    balance,
}: NotifyWithdrawParams): Promise<boolean> {
    const formatter = new Intl.NumberFormat("th-TH", {
        style: "currency",
        currency: "THB",
        minimumFractionDigits: 2,
    });

    const dateFormatter = new Intl.DateTimeFormat("th-TH", {
        dateStyle: "medium",
        timeStyle: "short",
    });

    const categoryText = categoryName ? `\nหมวดหมู่: ${categoryName}` : "";

    const message = `
💸 มีการเบิกเงิน!

👤 สมาชิก: ${personName}
📝 รายการ: ${label}${categoryText}
💵 จำนวน: ${formatter.format(amount)}
📅 วันที่: ${dateFormatter.format(transactionDate)}
━━━━━━━━━━━━━━━━━━
💼 ยอดคงเหลือ: ${formatter.format(balance)}
  `.trim();

    return sendLineMessage({ message });
}

type NotifySummaryParams = {
    personName: string;
    depositCount: number;
    withdrawCount: number;
    totalDeposit: number;
    totalWithdraw: number;
    balance: number;
};

export async function notifySummary({
    personName,
    depositCount,
    withdrawCount,
    totalDeposit,
    totalWithdraw,
    balance,
}: NotifySummaryParams): Promise<boolean> {
    const formatter = new Intl.NumberFormat("th-TH", {
        style: "currency",
        currency: "THB",
        minimumFractionDigits: 2,
    });

    const message = `
📊 สรุปข้อมูล: ${personName}

💰 ฝากเงิน
   • จำนวน: ${depositCount} ครั้ง
   • รวม: ${formatter.format(totalDeposit)}

💸 เบิกเงิน
   • จำนวน: ${withdrawCount} ครั้ง
   • รวม: ${formatter.format(totalWithdraw)}

━━━━━━━━━━━━━━━━━━
💼 ยอดคงเหลือ: ${formatter.format(balance)}
  `.trim();

    return sendLineMessage({ message });
}