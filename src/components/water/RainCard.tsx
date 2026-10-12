import { DataCard } from "@/components/ui/DataCard";
import { distanceKm } from "@/lib/geo";
import { getRainSnapshot, nowMs, stationsConfig } from "@/lib/services";
import { THAIWATER_SOURCE } from "@/lib/sources/thaiwater";
import { observationStale, rainLevelOf } from "@/lib/status-rules";

// ฝนสะสม 24 ชม. จากสถานีที่ใกล้พิกัดเสาธงหินที่สุด (พิกัดใน data/stations.json — ยังไม่ตรวจ)
// ถ้า schema ของ rain_24h ไม่ตรง / แหล่งข้อมูลล้ม → แสดง "ไม่พร้อมใช้งาน" ไม่เดาตัวเลข
export async function RainCard() {
  const snap = await getRainSnapshot();
  const { lat, lng, name, verified } = stationsConfig.home;
  const now = nowMs();
  const nearest = (snap.data ?? [])
    .map((s) => ({ s, d: distanceKm(lat, lng, s.lat, s.lng) }))
    .sort((a, b) => a.d - b.d)[0];

  return (
    <DataCard
      title="ฝนสะสม 24 ชม. ใกล้เสาธงหิน"
      value={nearest ? nearest.s.rain24hMm : null}
      unit="มม."
      level={nearest ? rainLevelOf(nearest.s.rain24hMm) : undefined}
      freshness={!nearest ? "unavailable" : snap.stale || observationStale(nearest.s.observedAt, "rain", now) ? "stale" : "live"}
      updatedAt={nearest?.s.observedAt ?? snap.fetchedAt}
      source={THAIWATER_SOURCE}
    >
      {nearest ? (
        <p className="text-base">
          สถานี {nearest.s.name} ห่างจุดอ้างอิงประมาณ {nearest.d.toFixed(1)} กม.
        </p>
      ) : (
        <p className="text-base text-ink-muted">{snap.error ?? "ยังไม่มีข้อมูลฝนจากแหล่งข้อมูล"}</p>
      )}
      <p className="mt-1 text-sm text-ink-muted">
        จุดอ้างอิง: {name}
        {!verified && " (พิกัดโดยประมาณ ยังไม่ได้ตรวจ)"}
      </p>
    </DataCard>
  );
}
