import { DataCard } from "@/components/ui/DataCard";
import { formatThaiDateTime } from "@/lib/format";
import type { DamReading } from "@/lib/sources/rid-dams";
import { RID_SOURCE } from "@/lib/sources/rid-dams";
import type { Freshness } from "@/lib/types";

const n = (v: number | null, d = 1) => (v === null ? "—" : v.toLocaleString("th-TH", { maximumFractionDigits: d }));

// การ์ดเขื่อน: % ความจุ + ปริมาณน้ำ + ไหลเข้า/ระบาย (หน่วยของไหลเข้า/ระบายตั้งค่าใน data/dams.json)
export function DamCard({ label, dam, date, freshness, flowUnit }: {
  label: string;
  dam: DamReading | null; // null = ไม่พบเขื่อนนี้ในข้อมูล
  date: string | null;
  freshness: Freshness;
  flowUnit: string | null;
}) {
  return (
    <DataCard
      title={label}
      value={dam?.percentStorage !== null && dam?.percentStorage !== undefined ? dam.percentStorage.toFixed(1) : null}
      unit="% ของความจุ"
      freshness={dam ? freshness : "unavailable"}
      source={RID_SOURCE}
      footer={
        <p>
          ข้อมูลประจำวันที่ {date ? formatThaiDateTime(`${date}T00:00:00+07:00`).replace(/ 00:00 น\.$/, "") : "ไม่ทราบ"} · แหล่งที่มา:{" "}
          <a href={RID_SOURCE.url} target="_blank" rel="noopener noreferrer" className="text-brand underline underline-offset-2">{RID_SOURCE.name}<span className="sr-only"> (เปิดในแท็บใหม่)</span></a>
        </p>
      }
    >
      {dam ? (
        <ul className="space-y-1 text-base">
          <li>ปริมาณน้ำในอ่าง {n(dam.volumeMcm ?? dam.storageMcm)} ล้าน ลบ.ม. {dam.capacityMcm !== null && `(ความจุ ${n(dam.capacityMcm)} ล้าน ลบ.ม.)`}</li>
          <li>
            น้ำไหลเข้า {n(dam.inflow, 2)} · ระบาย {n(dam.outflow, 2)}{" "}
            <span className="text-sm text-ink-muted">{flowUnit ?? "(ยังไม่ยืนยันหน่วย — ดูต้นฉบับ)"}</span>
          </li>
        </ul>
      ) : (
        <p className="text-base text-ink-muted">ไม่พบเขื่อนนี้ในข้อมูลล่าสุด (ชื่ออาจไม่ตรงกับที่ตั้งค่าไว้ใน data/dams.json)</p>
      )}
    </DataCard>
  );
}
