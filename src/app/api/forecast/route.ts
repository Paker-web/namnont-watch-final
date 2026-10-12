import { NextResponse } from "next/server";
import { getForecastSnapshot, normalizeCoords, weatherAreas } from "@/lib/services";
import { OPENMETEO_SOURCE } from "@/lib/sources/openmeteo";
import { summarizeNextHours } from "@/lib/weather-summary";

// GET /api/forecast?area=saothonghin   หรือ   /api/forecast?lat=13.88&lng=100.41
// พิกัดอยู่นอกประเทศไทยจะถูกปฏิเสธ (400) และปัดเหลือ 2 ตำแหน่งก่อนใช้
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const slug = sp.get("area");
  let name: string;
  let coords: { lat: number; lng: number } | null;

  if (slug) {
    const a = weatherAreas.find((x) => x.slug === slug);
    if (!a) return NextResponse.json({ error: "ไม่รู้จักพื้นที่นี้", areas: weatherAreas.map((x) => x.slug) }, { status: 400 });
    name = a.name;
    coords = normalizeCoords(a.lat, a.lng);
  } else {
    name = "ตำแหน่งของคุณ (โดยประมาณ)";
    coords = normalizeCoords(Number(sp.get("lat")), Number(sp.get("lng")));
  }
  if (!coords) return NextResponse.json({ error: "พิกัดไม่ถูกต้องหรืออยู่นอกประเทศไทย" }, { status: 400 });

  const snap = await getForecastSnapshot(coords.lat, coords.lng);
  const cache = snap.data === null ? "no-store" : snap.stale ? "public, s-maxage=60" : "public, s-maxage=1800, stale-while-revalidate=3600";
  return NextResponse.json(
    {
      area: { name, ...coords, approx: true },
      hourly: snap.data?.hourly ?? [],
      daily: snap.data?.daily ?? [],
      next6h: snap.data ? summarizeNextHours(snap.data.hourly) : null,
      fetchedAt: snap.fetchedAt,
      stale: snap.stale,
      unavailable: snap.data === null,
      error: snap.error,
      source: OPENMETEO_SOURCE,
    },
    { status: snap.data === null ? 503 : 200, headers: { "Cache-Control": cache } },
  );
}
