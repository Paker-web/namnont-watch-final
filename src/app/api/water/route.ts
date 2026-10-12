import { NextResponse } from "next/server";
import { PROVINCES, resolveProvince } from "@/lib/provinces";
import { getWaterSnapshot } from "@/lib/services";
import { THAIWATER_SOURCE } from "@/lib/sources/thaiwater";
import { byRisk, observationStale, waterLevelOf } from "@/lib/status-rules";

// GET /api/water?province=นนทบุรี   (หรือ nonthaburi / ayutthaya / pathumthani)
// เบราว์เซอร์เรียกเฉพาะ route นี้ ไม่เรียก ThaiWater ตรง ๆ
// ถ้า upstream ล้ม (429/5xx) จะคืนข้อมูลที่แคชไว้พร้อม stale:true หน้าเว็บไม่พัง
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("province") ?? "นนทบุรี";
  const province = resolveProvince(q);
  if (!province) {
    return NextResponse.json(
      { error: "ไม่รู้จักจังหวัดนี้", allowed: PROVINCES.map((p) => ({ th: p.th, slug: p.slug })) },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const snap = await getWaterSnapshot();
  const now = Date.now();
  const stations = (snap.data ?? [])
    .filter((s) => s.provinceCode === province.code)
    .sort(byRisk)
    .map((s) => ({
      ...s,
      level: waterLevelOf(s), // ระดับตามกติกาใน status-rules.ts
      observationStale: observationStale(s.observedAt, "water", now),
    }));

  const body = {
    province: province.th,
    stations,
    fetchedAt: snap.fetchedAt,
    stale: snap.stale,
    unavailable: snap.data === null,
    error: snap.error,
    retryAt: snap.retryAt,
    source: THAIWATER_SOURCE,
  };

  // ให้ CDN ของ Vercel ช่วยแคชอีกชั้น: ปกติ 300 วินาที, ถ้าเป็นข้อมูลค้างแคชสั้นลงเพื่อให้ฟื้นตัวเร็ว
  const cache = snap.data === null ? "no-store" : snap.stale ? "public, s-maxage=30" : "public, s-maxage=300, stale-while-revalidate=600";
  return NextResponse.json(body, { status: snap.data === null ? 503 : 200, headers: { "Cache-Control": cache } });
}
