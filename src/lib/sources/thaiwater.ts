import { SchemaError, UpstreamError } from "@/lib/errors";
import { dig, digFirst, toNum, toStr } from "@/lib/json";
import type { RainStation, SituationCode, Trend, WaterStation } from "@/lib/types";

// =====================================================================
// Adapter: ThaiWater (สสน.) — public API ไม่ต้องใช้ key
// หน้าที่: ดึงข้อมูล → แปลงเป็นชนิดกลาง (WaterStation / RainStation)
// ถ้าวันหนึ่ง API เปลี่ยน ให้แก้แค่ไฟล์นี้ (ส่วนอื่นของเว็บไม่ต้องแก้)
//
// สถานะการตรวจ schema:
//  - waterlevel_load : ตรวจกับ response จริงแล้ว (30 ก.ย. 2569)
//  - rain_24h        : ยังไม่ได้ตรวจ! ใช้ "ชื่อฟิลด์ที่คาดไว้หลายแบบ" ดูที่ RAIN_PATHS
//                      รัน `npm run probe` เพื่อดู response จริง แล้วปรับให้ตรง
// =====================================================================

export const THAIWATER_BASE =
  process.env.THAIWATER_BASE_URL ?? "https://api-v3.thaiwater.net/api/v1/thaiwater30/public";
export const THAIWATER_SITE = "https://www.thaiwater.net";
export const THAIWATER_SOURCE = { name: "ThaiWater (สสน.)", url: THAIWATER_SITE };

const USER_AGENT = process.env.THAIWATER_USER_AGENT ?? "NamNonWatch/0.1 (flood info site; non-commercial)";
const TIMEOUT_MS = 15_000;

/** ดึง JSON จาก endpoint — โยน UpstreamError เมื่อ 429/5xx/timeout เพื่อให้แคช backoff */
export async function fetchThaiwaterJson(endpoint: "waterlevel_load" | "rain_24h"): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(`${THAIWATER_BASE}/${endpoint}`, {
      headers: { Accept: "application/json", "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store", // เรามีแคชของเราเอง (src/lib/cache.ts)
    });
  } catch {
    throw new UpstreamError("เชื่อมต่อแหล่งข้อมูลไม่ได้ (timeout หรือไม่มีอินเทอร์เน็ต)", null);
  }
  if (!res.ok) {
    throw new UpstreamError(`แหล่งข้อมูลตอบ HTTP ${res.status}`, res.status, parseRetryAfter(res.headers.get("retry-after")));
  }
  try {
    return await res.json();
  } catch {
    throw new SchemaError("response ไม่ใช่ JSON");
  }
}

function parseRetryAfter(v: string | null): number | undefined {
  if (!v) return undefined;
  const sec = Number(v);
  if (Number.isFinite(sec)) return sec * 1000;
  const t = Date.parse(v); // รูปแบบวันที่
  return Number.isNaN(t) ? undefined : Math.max(0, t - Date.now());
}

/** "2026-09-30 01:50" (เวลาไทย ไม่มี timezone) → "2026-09-30T01:50:00+07:00" */
export function parseThaiTime(v: unknown): string | null {
  const s = toStr(v);
  const m = s?.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})/);
  return m ? `${m[1]}T${m[2]}:00+07:00` : null;
}

// ---------------------------------------------------------------------
// ระดับน้ำ (waterlevel_load)
// โครงสร้างจริง: { waterlevel_data: { result: "OK", data: [ {...สถานี} ] } }
// ตัวเลขหลายค่าส่งมาเป็น string เช่น "52.90"
// ---------------------------------------------------------------------
const TREND_BAND_M = 0.02; // เปลี่ยนน้อยกว่านี้ถือว่า "คงที่"

export function parseWaterLevel(json: unknown, opts: { provinceCodes?: string[] } = {}): WaterStation[] {
  const rows = dig(json, "waterlevel_data.data");
  if (!Array.isArray(rows)) throw new SchemaError("ไม่พบ waterlevel_data.data ใน response");

  const out: WaterStation[] = [];
  for (const r of rows) {
    const provinceCode = toStr(dig(r, "geocode.province_code"));
    if (!provinceCode) continue;
    if (opts.provinceCodes && !opts.provinceCodes.includes(provinceCode)) continue;

    const stationId = toStr(dig(r, "station.id"));
    if (!stationId) continue;

    const levelMsl = toNum(dig(r, "waterlevel_msl"));
    const previousMsl = toNum(dig(r, "waterlevel_msl_previous"));

    // diff_wl_bank เป็นค่าบวกเสมอ ทิศทางอยู่ในข้อความ "ล้นตลิ่ง (ม.)" / "ต่ำกว่าตลิ่ง (ม.)"
    const diffText = toStr(dig(r, "diff_wl_bank_text")) ?? "";
    const diffMag = toNum(dig(r, "diff_wl_bank"));
    const diffBankM =
      diffMag === null ? null : diffText.includes("ล้น") ? diffMag : diffText.includes("ต่ำกว่า") ? -diffMag : null;

    const code = toNum(dig(r, "situation_level"));
    const situationCode = code !== null && code >= 1 && code <= 5 ? (Math.round(code) as SituationCode) : null;

    out.push({
      id: `tw-${stationId}`,
      code: toStr(dig(r, "station.tele_station_oldcode")),
      name: toStr(dig(r, "station.tele_station_name.th")) ?? toStr(dig(r, "station.tele_station_name.en")) ?? `สถานี ${stationId}`,
      river: toStr(dig(r, "river_name")),
      provinceCode,
      province: toStr(dig(r, "geocode.province_name.th")) ?? "",
      amphoe: toStr(dig(r, "geocode.amphoe_name.th")),
      tambon: toStr(dig(r, "geocode.tumbon_name.th")),
      lat: toNum(dig(r, "station.tele_station_lat")),
      lng: toNum(dig(r, "station.tele_station_long")),
      levelMsl,
      previousMsl,
      trend: trendOf(levelMsl, previousMsl),
      bankMsl: toNum(dig(r, "station.min_bank")),
      diffBankM,
      bankPercent: toNum(dig(r, "storage_percent")),
      situationCode,
      discharge: toNum(dig(r, "discharge")),
      observedAt: parseThaiTime(dig(r, "waterlevel_datetime")),
      agency: toStr(dig(r, "agency.agency_shortname.th")) ?? toStr(dig(r, "agency.agency_name.th")),
      isKeyStation: dig(r, "station.is_key_station") === true,
    });
  }
  return out;
}

export function trendOf(now: number | null, prev: number | null): Trend | null {
  if (now === null || prev === null) return null;
  const d = now - prev;
  return d > TREND_BAND_M ? "rising" : d < -TREND_BAND_M ? "falling" : "steady";
}

// ---------------------------------------------------------------------
// ฝนสะสม 24 ชม. (rain_24h)
// TODO ตรวจ schema จริงด้วย `npm run probe` — ตอนนี้ยังไม่เคยเห็น response จริง
// ข้อมูลที่ทราบจากโปรเจกต์อื่น (ยังไม่ยืนยัน): ค่าฝนอยู่ในฟิลด์ rain_24h (มม.),
// จังหวัด/อำเภออยู่ใน geocode.* เหมือนระดับน้ำ, ~4,400 สถานีทั่วประเทศ
// ---------------------------------------------------------------------
const RAIN_PATHS = {
  id: ["station.id", "station_id", "id"],
  name: ["station.tele_station_name.th", "station.tele_station_name.en", "station.rain_station_name.th", "station.name.th", "station_name.th", "name.th"],
  lat: ["station.tele_station_lat", "station.rain_station_lat", "station.lat", "lat", "latitude"],
  lng: ["station.tele_station_long", "station.rain_station_long", "station.long", "station.lng", "long", "lng", "longitude"],
  rain24h: ["rain_24h", "rain24h", "rainfall_24h"],
  time: ["rainfall_datetime", "rain_datetime", "rain_24h_datetime", "datetime", "rainfall_date_time"],
} as const;

/** หาอาร์เรย์ของสถานีใน response โดยไม่รู้ชื่อคีย์ล่วงหน้า: {x:{data:[..]}} หรือ {data:[..]} หรือ [..] */
function findRows(json: unknown): unknown[] | null {
  if (Array.isArray(json)) return json;
  if (json && typeof json === "object") {
    for (const v of Object.values(json as Record<string, unknown>)) {
      if (Array.isArray(v)) return v;
      const inner = dig(v, "data");
      if (Array.isArray(inner)) return inner;
    }
  }
  return null;
}

export function parseRain(json: unknown, keep: (s: RainStation) => boolean = () => true): RainStation[] {
  const rows = findRows(json);
  if (!rows) throw new SchemaError("rain_24h: หาอาร์เรย์สถานีใน response ไม่เจอ (รัน npm run probe เพื่อดูโครงสร้างจริง)");

  const out: RainStation[] = [];
  let recognised = 0;
  for (const r of rows) {
    const rain = toNum(digFirst(r, [...RAIN_PATHS.rain24h]));
    const lat = toNum(digFirst(r, [...RAIN_PATHS.lat]));
    const lng = toNum(digFirst(r, [...RAIN_PATHS.lng]));
    if (rain === null || lat === null || lng === null) continue; // ไม่มีค่าจริง = ไม่แสดง (ห้ามเดา)
    recognised++;
    const st: RainStation = {
      id: `tw-rain-${toStr(digFirst(r, [...RAIN_PATHS.id])) ?? `${lat},${lng}`}`,
      name: toStr(digFirst(r, [...RAIN_PATHS.name])) ?? "สถานีวัดฝน",
      provinceCode: toStr(dig(r, "geocode.province_code")),
      province: toStr(dig(r, "geocode.province_name.th")),
      amphoe: toStr(dig(r, "geocode.amphoe_name.th")),
      lat,
      lng,
      rain24hMm: rain,
      observedAt: parseThaiTime(digFirst(r, [...RAIN_PATHS.time])),
    };
    if (keep(st)) out.push(st);
  }
  // มีข้อมูลแต่อ่านไม่ออกสักแถว = schema ไม่ตรง → แจ้งเป็น error ไม่ใช่ "ไม่มีฝน"
  if (rows.length > 0 && recognised === 0) {
    throw new SchemaError("rain_24h: อ่านค่าฝน/พิกัดจาก response ไม่ได้ — ชื่อฟิลด์ต่างจากที่คาด ตรวจด้วย npm run probe แล้วแก้ RAIN_PATHS");
  }
  return out;
}
