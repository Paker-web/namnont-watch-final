import { NextResponse } from "next/server";
import { distanceKm } from "@/lib/geo";
import { getRainSnapshot, stationsConfig } from "@/lib/services";
import { THAIWATER_SOURCE } from "@/lib/sources/thaiwater";
import { observationStale } from "@/lib/status-rules";

// GET /api/rain — ฝนสะสม 24 ชม. จากสถานีที่ใกล้พิกัดเสาธงหิน (data/stations.json → home) ที่สุด 5 สถานี
// ถ้า schema ของ rain_24h ยังไม่ตรง จะตอบ unavailable:true (ไม่แสดงตัวเลขเดา)
export const dynamic = "force-dynamic";

export async function GET() {
  const snap = await getRainSnapshot();
  const { lat, lng } = stationsConfig.home;
  const now = Date.now();
  const stations = (snap.data ?? [])
    .map((s) => ({ ...s, distanceKm: Math.round(distanceKm(lat, lng, s.lat, s.lng) * 10) / 10, observationStale: observationStale(s.observedAt, "rain", now) }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 5);

  const cache = snap.data === null ? "no-store" : snap.stale ? "public, s-maxage=30" : "public, s-maxage=300, stale-while-revalidate=600";
  return NextResponse.json(
    {
      reference: { name: stationsConfig.home.name, lat, lng, verified: stationsConfig.home.verified },
      stations,
      fetchedAt: snap.fetchedAt,
      stale: snap.stale,
      unavailable: snap.data === null,
      error: snap.error,
      retryAt: snap.retryAt,
      source: THAIWATER_SOURCE,
    },
    { status: snap.data === null ? 503 : 200, headers: { "Cache-Control": cache } },
  );
}
