import { ExternalLink, Sparkles } from "lucide-react";
import { DataCard } from "@/components/ui/DataCard";
import { Notice } from "@/components/ui/Notice";
import { ANNOUNCEMENT_STALE_HOURS, latestPublishable } from "@/lib/announcements";
import { nowMs } from "@/lib/services";

// การ์ดระบายน้ำเขื่อนเจ้าพระยา (ลบ.ม./วินาที) — ตัวเลขมาจากประกาศที่ AI สรุป (data/announcements.json)
// ป้าย "สรุปโดย AI" + ลิงก์ต้นฉบับแสดงเสมอ · ถ้ายังไม่มีข้อมูล แสดง "ยังไม่มีข้อมูล" (ห้ามเดา)
export function DamDischargeCard() {
  const e = latestPublishable();
  const time = e ? (e.announced_at ?? e.fetched_at) : null;
  const ageH = time ? (nowMs() - Date.parse(time)) / 3_600_000 : null;
  const stale = ageH !== null && ageH > ANNOUNCEMENT_STALE_HOURS;

  return (
    <DataCard
      title="ระบายน้ำเขื่อนเจ้าพระยา (ชัยนาท)"
      value={e?.discharge_cms ?? null}
      unit="ลบ.ม./วินาที"
      freshness={!e || e.discharge_cms === null ? "unavailable" : stale ? "stale" : "live"}
      updatedAt={time}
      source={e ? { name: e.source_name, url: e.source_url } : undefined}
    >
      {e ? (
        <div className="space-y-2 text-base">
          {e.warning_text && <Notice tone="warn">{e.warning_text}</Notice>}
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-muted">
            <span className="inline-flex items-center gap-1 rounded-full border-2 border-lv-none-line bg-lv-none-bg px-2.5 py-0.5 font-semibold text-lv-none-fg">
              <Sparkles className="h-4 w-4" aria-hidden />สรุปโดย AI
            </span>
            จากประกาศของ {e.source_name} —
            <a href={e.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-brand underline underline-offset-2">
              ตรวจสอบต้นฉบับ<ExternalLink className="h-3.5 w-3.5" aria-hidden /><span className="sr-only">(เปิดในแท็บใหม่)</span>
            </a>
          </p>
        </div>
      ) : (
        <p className="text-base text-ink-muted">ยังไม่มีประกาศที่ผ่านการตรวจ — ดูรายงานสถานการณ์น้ำของกรมชลประทานโดยตรง</p>
      )}
    </DataCard>
  );
}
