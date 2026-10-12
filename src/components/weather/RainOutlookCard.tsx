import { DataCard } from "@/components/ui/DataCard";
import { getForecastSnapshot, normalizeCoords, stationsConfig } from "@/lib/services";
import { OPENMETEO_SOURCE } from "@/lib/sources/openmeteo";
import { summarizeNextHours } from "@/lib/weather-summary";

// การ์ด "ฝน 6 ชั่วโมงข้างหน้า" สำหรับหน้าแรก (พื้นที่เสาธงหิน)
export async function RainOutlookCard() {
  const c = normalizeCoords(stationsConfig.home.lat, stationsConfig.home.lng);
  const snap = c ? await getForecastSnapshot(c.lat, c.lng) : null;
  const outlook = snap?.data ? summarizeNextHours(snap.data.hourly) : null;
  return (
    <DataCard
      title="ฝน 6 ชั่วโมงข้างหน้า ใกล้เสาธงหิน"
      valueSlot={outlook ? <span className="text-xl font-semibold leading-snug">{outlook.text}</span> : undefined}
      freshness={!outlook ? "unavailable" : snap?.stale ? "stale" : "live"}
      updatedAt={snap?.fetchedAt ?? null}
      source={OPENMETEO_SOURCE}
    >
      <p className="text-sm text-ink-muted">
        {outlook ? "ค่าพยากรณ์ ไม่ใช่ค่าที่วัดได้" : (snap?.error ?? "ยังไม่มีข้อมูลพยากรณ์")}
      </p>
    </DataCard>
  );
}
