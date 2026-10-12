import { NextResponse } from "next/server";
import { getRadarSnapshot } from "@/lib/services";
import { RADAR_COLOR, RADAR_MAX_NATIVE_ZOOM, RADAR_OPTIONS, RAINVIEWER_SOURCE } from "@/lib/sources/rainviewer";

// GET /api/radar — รายการเฟรมเรดาร์ย้อนหลัง (แคช 5 นาที) ให้หน้า /weather ใช้เล่น animation
// หน้าเว็บไม่เรียก RainViewer ตรงสำหรับรายการเฟรม; ส่วนรูป tile โหลดจาก host ที่ตอบกลับมา
export const dynamic = "force-dynamic";

export async function GET() {
  const snap = await getRadarSnapshot();
  const cache = snap.data === null ? "no-store" : snap.stale ? "public, s-maxage=30" : "public, s-maxage=300, stale-while-revalidate=600";
  return NextResponse.json(
    {
      host: snap.data?.host ?? null,
      frames: snap.data?.frames ?? [],
      generatedAt: snap.data?.generatedAt ?? null,
      tile: { size: 256, color: RADAR_COLOR, options: RADAR_OPTIONS, maxNativeZoom: RADAR_MAX_NATIVE_ZOOM },
      fetchedAt: snap.fetchedAt,
      stale: snap.stale,
      unavailable: snap.data === null,
      error: snap.error,
      source: RAINVIEWER_SOURCE,
    },
    { status: snap.data === null ? 503 : 200, headers: { "Cache-Control": cache } },
  );
}
