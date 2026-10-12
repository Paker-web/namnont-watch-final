"use client";

import { useState } from "react";
import { Link2, Share2 } from "lucide-react";

// ปุ่มแชร์: LINE (ลิงก์ share ทางการของ LINE) + คัดลอกลิงก์ — แชร์หน้าที่เปิดอยู่
export function ShareButtons() {
  const [copied, setCopied] = useState<boolean | null>(null);
  const href = () => window.location.href;
  const cls = "inline-flex min-h-12 items-center gap-2 rounded-control border-2 border-brand bg-surface px-4 text-base font-semibold text-brand";
  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      <button type="button" className={cls} onClick={() => window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(href())}`, "_blank", "noopener,noreferrer")}>
        <Share2 className="h-5 w-5" aria-hidden />แชร์ทาง LINE
      </button>
      <button
        type="button"
        className={cls}
        onClick={async () => {
          try { await navigator.clipboard.writeText(href()); setCopied(true); } catch { setCopied(false); }
        }}
      >
        <Link2 className="h-5 w-5" aria-hidden />คัดลอกลิงก์
      </button>
      <span role="status" className="text-sm text-ink-muted">{copied === true ? "คัดลอกแล้ว" : copied === false ? "คัดลอกอัตโนมัติไม่ได้" : ""}</span>
    </div>
  );
}
