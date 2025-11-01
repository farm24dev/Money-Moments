"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

function HomeIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9.5 12 3l9 6.5" />
      <path d="M4 10v10h6v-6h4v6h6V10" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3v5h5" />
      <path d="M3.05 13A9 9 0 1 0 9 3.34" />
      <path d="M12 7v5l4 2" />
    </svg>
  );
}

function CategoryIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m7.5 4.21 1.15 1.93" />
      <path d="m17.45 4.21-1.15 1.93" />
      <path d="M12 2v2" />
      <path d="M5 8h14" />
      <path d="M4 13h16" />
      <path d="M10 22 8 13" />
      <path d="m14 22 2-9" />
    </svg>
  );
}

export function AppSidebar() {
  const pathname = usePathname();

  const items: NavItem[] = useMemo(
    () => [
      { label: "แดชบอร์ด", href: "/", icon: <HomeIcon /> },
      { label: "ประวัติรวม", href: "/history", icon: <HistoryIcon /> },
      { label: "หมวดหมู่", href: "/categories", icon: <CategoryIcon /> },
    ],
    [],
  );

  return (
    <aside
      className="hidden w-64 flex-col border-r border-sidebar-border bg-sidebar px-4 py-6 text-sm text-sidebar-foreground shadow-sm lg:flex"
    >
      <div className="flex items-center gap-2 border-b border-sidebar-border pb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 3v18" />
            <path d="m5 12 7-9 7 9" />
            <path d="M5 19h14" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold">ระบบบันทึกการออมเงิน</p>
          <p className="text-xs text-sidebar-accent-foreground/80">จัดการยอดออมครอบครัว</p>
        </div>
      </div>
      <nav className="mt-6 space-y-1">
        {items.map((item) => {
          const isActive =
            pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto rounded-md border border-dashed border-sidebar-border bg-sidebar-accent/30 p-3 text-xs text-sidebar-foreground/80">
        <p className="font-medium text-sidebar-foreground">เคล็ดลับ</p>
        <p className="mt-1 leading-relaxed">
          ใช้หมวดหมู่เพื่อดูสัดส่วนการออม และอัพเดตยอดบันทึกได้ง่ายจากแบบฟอร์มด้านขวา
        </p>
      </div>
    </aside>
  );
}
