import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ระบบบันทึกการออมเงิน",
  description:
    "แอปสำหรับจัดการบันทึกยอดเงินออมของแต่ละคน พร้อมสรุปยอดรวมและประวัติการฝาก",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className="antialiased">{children}</body>
    </html>
  );
}
