import { StatusBadge } from "@/components/ui/StatusBadge";
import { TimeAgo } from "@/components/ui/TimeAgo";
import type { StationView } from "./StationCard";
import { TrendLabel } from "./Trend";

// ตารางสถานี เรียงตามความเสี่ยง (% ตลิ่งสูงสุดก่อน) — เรียงมาจาก API แล้ว
export function StationTable({ stations, snapshotStale }: { stations: StationView[]; snapshotStale: boolean }) {
  if (stations.length === 0) return null;
  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface">
      <table className="w-full text-left text-base">
        <caption className="sr-only">สถานีวัดระดับน้ำเรียงตามความเสี่ยง</caption>
        <thead className="bg-surface-2 text-sm">
          <tr>
            <th scope="col" className="px-3 py-2 font-semibold">สถานี</th>
            <th scope="col" className="px-2 py-2 font-semibold">% ตลิ่ง</th>
            <th scope="col" className="px-2 py-2 font-semibold">สถานะ</th>
          </tr>
        </thead>
        <tbody>
          {stations.map((s) => (
            <tr key={s.id} className="border-t border-line align-top">
              <th scope="row" className="px-3 py-2 font-medium">
                {s.name}
                <span className="block text-sm font-normal text-ink-muted">
                  {[s.river, s.amphoe && `อ.${s.amphoe}`].filter(Boolean).join(" · ")}
                </span>
                <span className="block text-sm font-normal text-ink-muted">
                  <TrendLabel trend={s.trend} /> · {s.observedAt ? <TimeAgo iso={s.observedAt} /> : "ไม่ทราบเวลา"}
                </span>
              </th>
              <td className="px-2 py-2 tabular-nums">{s.bankPercent !== null ? `${Math.round(s.bankPercent)}%` : "—"}</td>
              <td className="px-2 py-2">
                <div className="flex flex-col items-start gap-1">
                  {s.level ? <StatusBadge kind="level" value={s.level} /> : <span className="text-ink-muted">ไม่มีข้อมูล</span>}
                  {(snapshotStale || s.observationStale) && <StatusBadge kind="freshness" value="stale" />}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
