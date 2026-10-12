import { DataCard } from "@/components/ui/DataCard";
import { THAIWATER_SOURCE } from "@/lib/sources/thaiwater";
import type { SituationLevel, WaterStation } from "@/lib/types";
import { TrendLabel } from "./Trend";

export type StationView = WaterStation & { level: SituationLevel | null; observationStale: boolean };

// การ์ดสถานีวัดน้ำ: ระดับน้ำ (ม.รทก.) + เทียบตลิ่ง + แนวโน้ม
// freshness: ถ้าข้อมูลทั้งชุดค้าง (snapshotStale) หรือสถานีนี้วัดนานแล้ว → "ค้าง"
export function StationCard({ st, snapshotStale }: { st: StationView; snapshotStale: boolean }) {
  const stale = snapshotStale || st.observationStale;
  const bankText =
    st.diffBankM === null
      ? null
      : st.diffBankM >= 0
        ? `ล้นตลิ่ง ${st.diffBankM.toFixed(2)} ม.`
        : `ต่ำกว่าตลิ่ง ${Math.abs(st.diffBankM).toFixed(2)} ม.`;

  return (
    <DataCard
      title={st.name}
      value={st.levelMsl !== null ? st.levelMsl.toFixed(2) : null}
      unit="ม.รทก."
      level={st.level ?? undefined}
      freshness={st.levelMsl === null ? "unavailable" : stale ? "stale" : "live"}
      updatedAt={st.observedAt}
      source={THAIWATER_SOURCE}
    >
      <ul className="space-y-1 text-base">
        <li className="text-ink-muted">
          {[st.river, st.amphoe && `อ.${st.amphoe}`, st.code].filter(Boolean).join(" · ")}
        </li>
        {bankText && <li>{bankText}</li>}
        {st.bankPercent !== null && <li>ระดับน้ำ {Math.round(st.bankPercent)}% ของระดับตลิ่ง</li>}
        <li>
          แนวโน้ม: <TrendLabel trend={st.trend} />
        </li>
        {st.observationStale && !snapshotStale && (
          <li className="text-lv-watch-fg">สถานีนี้ไม่ได้ส่งค่าใหม่มานานเกินเกณฑ์</li>
        )}
      </ul>
    </DataCard>
  );
}
