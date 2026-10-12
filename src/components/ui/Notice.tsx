import type { ReactNode } from "react";
import { Info, OctagonAlert, TriangleAlert } from "lucide-react";

// กล่องแจ้งเตือนสั้น ๆ: info / warn / error — มีไอคอนและข้อความเสมอ ไม่สื่อด้วยสีอย่างเดียว
const STYLE = {
  info: { box: "border-lv-none-line bg-lv-none-bg text-lv-none-fg", Icon: Info },
  warn: { box: "border-lv-watch-line bg-lv-watch-bg text-lv-watch-fg", Icon: TriangleAlert },
  error: { box: "border-lv-critical-line bg-lv-critical-bg text-lv-critical-fg", Icon: OctagonAlert },
} as const;

export function Notice({ tone = "info", children }: { tone?: keyof typeof STYLE; children: ReactNode }) {
  const { box, Icon } = STYLE[tone];
  return (
    <div role={tone === "error" ? "alert" : "note"} className={`flex gap-2 rounded-control border-2 p-3 text-base ${box}`}>
      <Icon className="mt-1 h-5 w-5 shrink-0" aria-hidden />
      <div>{children}</div>
    </div>
  );
}
