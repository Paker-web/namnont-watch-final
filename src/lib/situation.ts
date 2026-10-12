import type { Freshness, SituationLevel } from "./types";

// ข้อความไทยของแต่ละระดับ (ไอคอนอยู่ใน StatusBadge)
// หมายเหตุ: ยังไม่กำหนดเกณฑ์ตัวเลขของแต่ละระดับ — ต้องอ้างอิงเกณฑ์ทางการในเฟสถัดไป
export const LEVEL_LABEL: Record<SituationLevel, string> = {
  ok: "ปกติ",
  watch: "เฝ้าระวัง",
  warning: "เตือนภัย",
  critical: "วิกฤต",
};

export const LEVEL_ORDER: SituationLevel[] = ["ok", "watch", "warning", "critical"];

export const FRESHNESS_LABEL: Record<Freshness, string> = {
  live: "สด",
  stale: "ค้าง",
  unavailable: "ไม่พร้อมใช้งาน",
};
