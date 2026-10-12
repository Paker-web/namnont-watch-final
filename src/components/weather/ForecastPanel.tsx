import { DataCard } from "@/components/ui/DataCard";
import { Notice } from "@/components/ui/Notice";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { getForecastSnapshot } from "@/lib/services";
import { OPENMETEO_SOURCE } from "@/lib/sources/openmeteo";
import { summarizeNextHours } from "@/lib/weather-summary";
import { HourlyChartLazy } from "./HourlyChartLazy";

const TZ = "Asia/Bangkok";
const dayLabel = (iso: string) => new Date(iso).toLocaleDateString("th-TH", { weekday: "short", timeZone: TZ });
const dateLabel = (d: string) => new Date(`${d}T00:00:00+07:00`).toLocaleDateString("th-TH", { weekday: "short", day: "numeric", month: "short", timeZone: TZ });
const num = (v: number | null, digits = 0) => (v === null ? "—" : v.toFixed(digits));

// พยากรณ์ (เซิร์ฟเวอร์ดึง + แคช 30 นาที): สรุปฝน 6 ชม. · กราฟ 48 ชม. · รายวัน 7 วัน
export async function ForecastPanel({ areaName, lat, lng, approx }: { areaName: string; lat: number; lng: number; approx: boolean }) {
  const snap = await getForecastSnapshot(lat, lng);

  if (!snap.data) {
    return (
      <Notice tone="error">
        <strong>พยากรณ์ไม่พร้อมใช้งานชั่วคราว</strong> — {snap.error ?? "ดึงข้อมูลไม่สำเร็จ"} ดูเรดาร์ด้านบนหรือเว็บกรมอุตุนิยมวิทยาแทนได้
      </Notice>
    );
  }
  const { hourly, daily } = snap.data;
  const outlook = summarizeNextHours(hourly);
  const chart = hourly.map((h) => ({
    hour: h.time.slice(11, 16),
    day: dayLabel(h.time),
    mm: h.precipMm ?? 0,
    prob: h.precipProb,
  }));

  return (
    <div className="space-y-6">
      {snap.stale && (
        <Notice tone="warn"><strong>ข้อมูลค้าง</strong> — ดึงพยากรณ์ใหม่ไม่สำเร็จ แสดงค่าที่บันทึกไว้ก่อนหน้า</Notice>
      )}

      <DataCard
        title={`ฝน 6 ชั่วโมงข้างหน้า — ${areaName}`}
        valueSlot={<span className="text-xl font-semibold leading-snug">{outlook.text}</span>}
        freshness={snap.stale ? "stale" : "live"}
        updatedAt={snap.fetchedAt}
        source={OPENMETEO_SOURCE}
      >
        <p className="text-sm text-ink-muted">
          เป็นค่าพยากรณ์ ไม่ใช่ค่าที่วัดได้ · พิกัด {lat.toFixed(2)}, {lng.toFixed(2)}
          {approx && " (ค่าประมาณ)"}
        </p>
      </DataCard>

      <section>
        <SectionTitle description="แท่ง = ปริมาณฝน เส้น = โอกาสฝน">พยากรณ์รายชั่วโมง 48 ชม.</SectionTitle>
        <div className="rounded-card border border-line bg-surface p-3">
          <HourlyChartLazy data={chart} />
        </div>
      </section>

      <section>
        <SectionTitle>พยากรณ์ 7 วัน</SectionTitle>
        <div className="overflow-x-auto rounded-card border border-line bg-surface">
          <table className="w-full min-w-[22rem] text-left text-base">
            <caption className="sr-only">พยากรณ์รายวัน 7 วัน</caption>
            <thead className="bg-surface-2 text-sm">
              <tr>
                <th scope="col" className="px-3 py-2">วัน</th>
                <th scope="col" className="px-2 py-2">โอกาสฝน</th>
                <th scope="col" className="px-2 py-2">ฝนรวม</th>
                <th scope="col" className="px-2 py-2">ลมสูงสุด</th>
                <th scope="col" className="px-2 py-2">อุณหภูมิ</th>
              </tr>
            </thead>
            <tbody>
              {daily.map((d) => (
                <tr key={d.date} className="border-t border-line">
                  <th scope="row" className="px-3 py-2 font-medium">{dateLabel(d.date)}</th>
                  <td className="px-2 py-2 tabular-nums">{d.precipProbMax === null ? "—" : `${Math.round(d.precipProbMax)}%`}</td>
                  <td className="px-2 py-2 tabular-nums">{num(d.precipSumMm, 1)} มม.</td>
                  <td className="px-2 py-2 tabular-nums">{num(d.windMaxKmh)} กม./ชม.</td>
                  <td className="px-2 py-2 tabular-nums">{num(d.tMin)}–{num(d.tMax)}°C</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <p className="text-sm text-ink-muted">
        <a href={OPENMETEO_SOURCE.url} target="_blank" rel="noopener noreferrer" className="text-brand underline underline-offset-2">
          Weather data by Open-Meteo.com
        </a>{" "}
        (CC BY 4.0)
      </p>
    </div>
  );
}
