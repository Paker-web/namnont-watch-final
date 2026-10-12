import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ใช้เมื่อยังไม่มีข้อมูลหรือหน้ายังไม่เปิดใช้งาน: บอกว่าเกิดอะไรขึ้น และให้ทางไปต่อ
export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-card border-2 border-dashed border-line bg-surface p-6 text-center">
      <Icon className="mx-auto h-10 w-10 text-ink-muted" aria-hidden />
      <p className="mt-3 text-lg font-semibold">{title}</p>
      {description && <p className="mx-auto mt-1 max-w-prose text-base text-ink-muted">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
