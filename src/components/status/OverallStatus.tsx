import { getOverallStatus } from "@/lib/services";
import { THAIWATER_SOURCE } from "@/lib/sources/thaiwater";
import { DataCard } from "@/components/ui/DataCard";
import { StatusBadge } from "@/components/ui/StatusBadge";

// แถบสถานะรวมหน้าแรก — คำนวณตามกติกาใน src/lib/status-rules.ts
// ถ้าแหล่งข้อมูลล้ม จะแสดง "ไม่พร้อมใช้งาน" แทน (หน้าไม่พัง)
export async function OverallStatus() {
  const r = await getOverallStatus();
  const o = r.overall;

  const valueSlot = o?.level ? (
    <StatusBadge kind="level" value={o.level} size="lg" />
  ) : (
    <span className="text-xl font-semibold text-ink-muted">
      {r.freshness === "unavailable" ? "ไม่พร้อมใช้งาน" : "ยังไม่มีข้อมูลสดพอจะสรุป"}
    </span>
  );

  return (
    <DataCard
      title="สถานะรวม จ.นนทบุรี"
      valueSlot={valueSlot}
      level={o?.level ?? undefined}
      freshness={r.freshness}
      updatedAt={o?.newestObservedAt ?? r.fetchedAt}
      source={THAIWATER_SOURCE}
    >
      {o && (
        <ul className="space-y-1 text-base">
          <li>
            คำนวณจาก {o.waterUsed} สถานีวัดน้ำที่ข้อมูลยังสด
            {r.basis === "all-nonthaburi" && " (ทุกสถานีในนนทบุรี — ยังไม่ได้เลือกสถานีหลัก)"}
          </li>
          {o.worst && (
            <li>
              สูงที่สุด: {o.worst.name}
              {o.worst.bankPercent !== null && ` — ${Math.round(o.worst.bankPercent)}% ของระดับตลิ่ง`}
            </li>
          )}
          {o.waterSkippedStale > 0 && (
            <li className="text-ink-muted">ไม่นับ {o.waterSkippedStale} สถานีที่ข้อมูลค้างนานเกินเกณฑ์</li>
          )}
          {o.rainMaxMm !== null && (
            <li>
              ฝน 24 ชม. สูงสุดใกล้เสาธงหิน: {o.rainMaxMm} มม. ({o.rainStationName})
            </li>
          )}
          {r.rainNote && <li className="text-ink-muted">{r.rainNote}</li>}
        </ul>
      )}
      {!o && r.error && <p className="text-base text-ink-muted">{r.error} — ตรวจสอบกับ ปภ. โทร 1784</p>}
    </DataCard>
  );
}
