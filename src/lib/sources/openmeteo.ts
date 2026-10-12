import { SchemaError, UpstreamError } from "@/lib/errors";
import { dig, toNum } from "@/lib/json";

// =====================================================================
// Adapter: Open-Meteo (พยากรณ์อากาศ) — ฟรี ไม่ต้องใช้ key (ใช้แบบไม่แสวงหากำไร)
// เครดิตที่ต้องแสดง: "Weather data by Open-Meteo.com" (CC BY 4.0) พร้อมลิงก์
// สถานะ: เขียนตามเอกสาร API ของ Open-Meteo — ยังไม่ได้ทดสอบกับ API จริงจาก sandbox (เข้าไม่ถึง)
//        ถ้า response ไม่ตรงโครงสร้าง จะโยน SchemaError → หน้าเว็บแสดง "ไม่พร้อมใช้งาน"
// =====================================================================

export const OPENMETEO_BASE = process.env.OPENMETEO_BASE_URL ?? "https://api.open-meteo.com/v1/forecast";
export const OPENMETEO_SOURCE = { name: "Open-Meteo.com", url: "https://open-meteo.com" };

export interface HourlyPoint {
  time: string; // ISO +07:00
  precipProb: number | null; // %
  precipMm: number | null; // มม./ชม.
  windKmh: number | null;
  gustKmh: number | null;
}
export interface DailyPoint {
  date: string; // YYYY-MM-DD
  precipSumMm: number | null;
  precipProbMax: number | null;
  windMaxKmh: number | null;
  tMax: number | null;
  tMin: number | null;
}
export interface Forecast {
  lat: number;
  lng: number;
  hourly: HourlyPoint[]; // 48 ชั่วโมงถัดไป (เริ่มจากชั่วโมงปัจจุบัน)
  daily: DailyPoint[]; // 7 วัน
}

const HOURLY = ["precipitation_probability", "precipitation", "wind_speed_10m", "wind_gusts_10m"];
const DAILY = ["precipitation_sum", "precipitation_probability_max", "wind_speed_10m_max", "temperature_2m_max", "temperature_2m_min"];

function col(root: unknown, path: string, n: number): (number | null)[] {
  const arr = dig(root, path);
  if (!Array.isArray(arr)) throw new SchemaError(`Open-Meteo: ไม่พบ ${path}`);
  return Array.from({ length: n }, (_, i) => toNum(arr[i]));
}

/** nowLocal: "2026-10-01T14:00" (เวลาไทยปัดลงเป็นชั่วโมง) ใช้ตัดชั่วโมงที่ผ่านไปแล้วออก */
export function parseForecast(json: unknown, lat: number, lng: number, nowLocal: string): Forecast {
  const times = dig(json, "hourly.time");
  const days = dig(json, "daily.time");
  if (!Array.isArray(times) || !Array.isArray(days)) throw new SchemaError("Open-Meteo: ไม่พบ hourly.time / daily.time");

  const prob = col(json, "hourly.precipitation_probability", times.length);
  const mm = col(json, "hourly.precipitation", times.length);
  const wind = col(json, "hourly.wind_speed_10m", times.length);
  const gust = col(json, "hourly.wind_gusts_10m", times.length);
  const start = Math.max(0, times.findIndex((t) => typeof t === "string" && t >= nowLocal));

  const hourly: HourlyPoint[] = [];
  for (let i = start; i < Math.min(times.length, start + 48); i++) {
    const t = String(times[i]);
    hourly.push({ time: `${t}:00+07:00`, precipProb: prob[i], precipMm: mm[i], windKmh: wind[i], gustKmh: gust[i] });
  }

  const sum = col(json, "daily.precipitation_sum", days.length);
  const pmax = col(json, "daily.precipitation_probability_max", days.length);
  const wmax = col(json, "daily.wind_speed_10m_max", days.length);
  const tmax = col(json, "daily.temperature_2m_max", days.length);
  const tmin = col(json, "daily.temperature_2m_min", days.length);
  const daily: DailyPoint[] = days.slice(0, 7).map((d, i) => ({
    date: String(d), precipSumMm: sum[i], precipProbMax: pmax[i], windMaxKmh: wmax[i], tMax: tmax[i], tMin: tmin[i],
  }));
  if (hourly.length === 0) throw new SchemaError("Open-Meteo: ไม่มีข้อมูลรายชั่วโมง");
  return { lat, lng, hourly, daily };
}

/** เวลาไทยตอนนี้ ปัดลงเป็นชั่วโมง รูปแบบเดียวกับ hourly.time ของ Open-Meteo */
export function bangkokHourNow(nowMs = Date.now()): string {
  return new Date(nowMs + 7 * 3600_000).toISOString().slice(0, 13) + ":00";
}

export async function fetchForecast(lat: number, lng: number): Promise<Forecast> {
  const url =
    `${OPENMETEO_BASE}?latitude=${lat}&longitude=${lng}` +
    `&hourly=${HOURLY.join(",")}&daily=${DAILY.join(",")}&timezone=Asia%2FBangkok&forecast_days=7`;
  let res: Response;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(12_000), cache: "no-store" });
  } catch {
    throw new UpstreamError("เชื่อมต่อ Open-Meteo ไม่ได้", null);
  }
  if (!res.ok) throw new UpstreamError(`Open-Meteo ตอบ HTTP ${res.status}`, res.status);
  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new SchemaError("Open-Meteo: response ไม่ใช่ JSON");
  }
  return parseForecast(json, lat, lng, bangkokHourNow());
}
