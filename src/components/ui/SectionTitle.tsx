import type { ReactNode } from "react";

// หัวข้อส่วนต่าง ๆ ในหน้า — ใช้ h2 เสมอ (h1 อยู่ที่ชื่อหน้า)
export function SectionTitle({
  children,
  description,
  action,
  as: Tag = "h2",
}: {
  children: ReactNode;
  description?: string;
  action?: ReactNode;
  as?: "h1" | "h2";
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        <Tag className={Tag === "h1" ? "text-2xl font-bold leading-tight" : "text-xl font-bold leading-tight"}>
          {children}
        </Tag>
        {description && <p className="mt-1 text-base text-ink-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
