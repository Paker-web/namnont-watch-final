import Link from "next/link";
import type { ReactNode } from "react";

// ปุ่มลิงก์มาตรฐาน (สูงอย่างน้อย 48px กดง่ายด้วยนิ้ว)
const VARIANT = {
  primary: "bg-brand text-brand-ink border-brand",
  outline: "bg-surface text-brand border-brand",
  call: "bg-call text-call-ink border-call",
} as const;

export function ButtonLink({
  href,
  children,
  variant = "primary",
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: keyof typeof VARIANT;
  className?: string;
}) {
  const cls = `inline-flex min-h-12 items-center justify-center gap-2 rounded-control border-2 px-4 py-2 text-base font-semibold ${VARIANT[variant]} ${className}`;
  // ลิงก์ tel: / http ใช้ <a> ธรรมดา, ลิงก์ในเว็บใช้ next/link
  if (href.startsWith("tel:") || href.startsWith("http")) {
    return (
      <a href={href} className={cls}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}
