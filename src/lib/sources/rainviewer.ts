import { SchemaError, UpstreamError } from "@/lib/errors";
import { dig, toNum, toStr } from "@/lib/json";

// =====================================================================
// Adapter: RainViewer (เรดาร์ฝนย้อนหลัง) — ตรวจเงื่อนไขจากเอกสารทางการ 1 ต.ค. 2569
//  - ฟรีเฉพาะ "เรดาร์ย้อนหลัง 2 ชม. ทุก 10 นาที" (ไม่มีเรดาร์พยากรณ์/ดาวเทียมแล้วตั้งแต่ 1 ม.ค. 2569)
//  - ซูมสูงสุดของ tile = 7 → เราตั้ง maxNativeZoom=7 ให้ Leaflet ขยายภาพเอง (ภาพจะหยาบเมื่อซูมใกล้)
//  - สีใช้ได้เฉพาะ Universal Blue (รหัส 2) · จำกัด 100 คำขอ/IP/นาที
//  - ต้องใส่เครดิต "Weather data by RainViewer" พร้อมลิงก์
// ส่วน tile (รูปภาพ) เบราว์เซอร์โหลดจาก host ของ RainViewer โดยตรงตามธรรมชาติของ tile layer
// แต่ "รายการเฟรม" (weather-maps.json) เราดึงผ่านเซิร์ฟเวอร์ + แคช
// =====================================================================

export const RAINVIEWER_URL = process.env.RAINVIEWER_URL ?? "https://api.rainviewer.com/public/weather-maps.json";
export const RAINVIEWER_SOURCE = { name: "RainViewer", url: "https://www.rainviewer.com" };
export const RADAR_MAX_NATIVE_ZOOM = 7;
export const RADAR_COLOR = 2; // Universal Blue
export const RADAR_OPTIONS = "1_1"; // 1 = ภาพเรียบ, 1 = แสดงหิมะ

export interface RadarFrame {
  time: string; // ISO 8601 (UTC)
  path: string; // เช่น /v2/radar/1609402200
}
export interface RadarIndex {
  host: string;
  generatedAt: string | null;
  frames: RadarFrame[];
}

export function parseRadarIndex(json: unknown): RadarIndex {
  const host = toStr(dig(json, "host"));
  const past = dig(json, "radar.past");
  if (!host || !Array.isArray(past)) throw new SchemaError("weather-maps.json: ไม่พบ host หรือ radar.past");
  const frames: RadarFrame[] = [];
  for (const f of past) {
    const t = toNum(dig(f, "time"));
    const path = toStr(dig(f, "path"));
    if (t !== null && path) frames.push({ time: new Date(t * 1000).toISOString(), path });
  }
  if (frames.length === 0) throw new SchemaError("weather-maps.json: ไม่มีเฟรมเรดาร์");
  const gen = toNum(dig(json, "generated"));
  return { host, generatedAt: gen ? new Date(gen * 1000).toISOString() : null, frames };
}

export async function fetchRadarIndex(): Promise<RadarIndex> {
  let res: Response;
  try {
    res = await fetch(RAINVIEWER_URL, { signal: AbortSignal.timeout(10_000), cache: "no-store" });
  } catch {
    throw new UpstreamError("เชื่อมต่อ RainViewer ไม่ได้", null);
  }
  if (!res.ok) throw new UpstreamError(`RainViewer ตอบ HTTP ${res.status}`, res.status);
  try {
    return parseRadarIndex(await res.json());
  } catch (e) {
    if (e instanceof SchemaError) throw e;
    throw new SchemaError("weather-maps.json ไม่ใช่ JSON");
  }
}
