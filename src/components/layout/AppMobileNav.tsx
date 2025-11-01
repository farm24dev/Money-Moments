"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { buttonClassName } from "@/lib/button-classes";

const navItems = [
  { label: "แดชบอร์ด", href: "/" },
  { label: "ประวัติรวม", href: "/history" },
  { label: "หมวดหมู่", href: "/categories" },
];

export function AppMobileNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap gap-2">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={buttonClassName({
              variant: isActive ? "secondary" : "outline",
              size: "sm",
            })}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
