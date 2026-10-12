import { CircleCheck, Eye, TriangleAlert, OctagonAlert, Wifi, Clock, CloudOff } from "lucide-react";
import type { ComponentType } from "react";
import type { Freshness, SituationLevel } from "@/lib/types";
import { FRESHNESS_LABEL, LEVEL_LABEL } from "@/lib/situation";

// ป้ายสถานะ 2 แบบ:
//   <StatusBadge kind="level" value="watch" />      → ระดับสถานการณ์ (ปกติ/เฝ้าระวัง/เตือนภัย/วิกฤต)
//   <StatusBadge kind="freshness" value="stale" />  → ความสดของข้อมูล (สด/ค้าง/ไม่พร้อมใช้งาน)
// ทุกป้ายมี "ไอคอน + ข้อความ" เสมอ ไม่สื่อด้วยสีอย่างเดียว

type Props =
  | { kind: "level"; value: SituationLevel; size?: "sm" | "lg" }
  | { kind: "freshness"; value: Freshness; size?: "sm" | "lg" };

type IconType = ComponentType<{ className?: string; "aria-hidden"?: boolean }>;

// หมายเหตุ: ต้องเขียนชื่อ class เต็ม ๆ เพื่อให้ Tailwind มองเห็นตอน build
const STYLE = {
  ok: "bg-lv-ok-bg text-lv-ok-fg border-lv-ok-line",
  watch: "bg-lv-watch-bg text-lv-watch-fg border-lv-watch-line",
  warning: "bg-lv-warning-bg text-lv-warning-fg border-lv-warning-line",
  critical: "bg-lv-critical-bg text-lv-critical-fg border-lv-critical-line",
  none: "bg-lv-none-bg text-lv-none-fg border-lv-none-line",
} as const;

const LEVEL_ICON: Record<SituationLevel, IconType> = {
  ok: CircleCheck,
  watch: Eye,
  warning: TriangleAlert,
  critical: OctagonAlert,
};

const FRESHNESS_ICON: Record<Freshness, IconType> = {
  live: Wifi,
  stale: Clock,
  unavailable: CloudOff,
};

const FRESHNESS_STYLE: Record<Freshness, string> = {
  live: STYLE.ok,
  stale: STYLE.watch,
  unavailable: STYLE.none,
};

export function StatusBadge(props: Props) {
  const { kind, value, size = "sm" } = props;
  const Icon = kind === "level" ? LEVEL_ICON[value] : FRESHNESS_ICON[value];
  const label = kind === "level" ? LEVEL_LABEL[value] : FRESHNESS_LABEL[value];
  const style = kind === "level" ? STYLE[value] : FRESHNESS_STYLE[value];
  const sizing = size === "lg" ? "gap-2 px-4 py-2 text-lg" : "gap-1.5 px-2.5 py-0.5 text-sm";

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full border-2 font-semibold ${sizing} ${style}`}
    >
      <Icon className={size === "lg" ? "h-5 w-5" : "h-4 w-4"} aria-hidden />
      {label}
    </span>
  );
}
