"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardCheck, House, Map as MapIcon, Radar, Waves } from "lucide-react";

// เมนูล่างสำหรับมือถือ 5 ปุ่ม (เมนู "ช่วยเหลือ" อยู่ที่ Header)
// หน้าที่เปิดอยู่จะมี: ขีดด้านบน + ตัวหนา + พื้นหลัง และ aria-current (ไม่สื่อด้วยสีอย่างเดียว)
const ITEMS = [
  { href: "/", label: "ภาพรวม", Icon: House },
  { href: "/water", label: "ระดับน้ำ", Icon: Waves },
  { href: "/weather", label: "เรดาร์", Icon: Radar },
  { href: "/prepare", label: "เตรียมตัว", Icon: ClipboardCheck },
  { href: "/map", label: "แผนที่", Icon: MapIcon },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="เมนูหลัก"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] print:hidden"
    >
      <ul className="mx-auto grid max-w-2xl grid-cols-5">
        {ITEMS.map(({ href, label, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-16 flex-col items-center justify-center gap-0.5 border-t-4 px-1 py-1.5 text-xs ${
                  active
                    ? "border-brand bg-brand-soft font-bold text-brand"
                    : "border-transparent font-medium text-ink-muted"
                }`}
              >
                <Icon className="h-6 w-6" aria-hidden />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
