import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import type { Trend } from "@/lib/types";

// แนวโน้มระดับน้ำ: ไอคอน + ข้อความ (ไม่ใช้สีอย่างเดียว)
const MAP = {
  rising: { Icon: ArrowUp, text: "กำลังขึ้น" },
  falling: { Icon: ArrowDown, text: "กำลังลง" },
  steady: { Icon: Minus, text: "ทรงตัว" },
} as const;

export function TrendLabel({ trend }: { trend: Trend | null }) {
  if (!trend) return <span className="text-ink-muted">ไม่ทราบ</span>;
  const { Icon, text } = MAP[trend];
  return (
    <span className="inline-flex items-center gap-1 font-medium">
      <Icon className="h-4 w-4" aria-hidden />
      {text}
    </span>
  );
}
