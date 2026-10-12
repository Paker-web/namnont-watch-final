import stationsJson from "@data/stations.json";
import { cached } from "./cache";
import type { StationsConfig } from "./content-types";
import { distanceKm } from "./geo";
import { PROVINCES } from "./provinces";
import { computeOverall, freshnessOf, type OverallStatus } from "./status-rules";
import weatherAreasJson from "@data/weather-areas.json";
import { fetchRadarIndex, type RadarIndex } from "./sources/rainviewer";
import { fetchForecast, type Forecast } from "./sources/openmeteo";
import { fetchThaiwaterJson, parseRain, parseWaterLevel } from "./sources/thaiwater";
import type { Freshness, RainStation, Snapshot, WaterStation } from "./types";

// ชั้นบริการ: ผูก adapter + แคชเข้าด้วยกัน ใช้ร่วมกันทั้ง Route Handler และหน้าเว็บ (server component)

export const stationsConfig = stationsJson as StationsConfig;

// อายุแคช 300 วินาที (ตามที่กำหนด 300–600) ปรับได้ด้วยตัวแปร WATER_CACHE_TTL_MS (ใช้ตอนทดสอบ)
const TTL_MS = Number(process.env.WATER_CACHE_TTL_MS ?? 300_000);
const PROVINCE_CODES = PROVINCES.map((p) => p.code);
const RAIN_KEEP_KM = 40; // เก็บสถานีฝนในรัศมีนี้รอบพิกัดบ้าน (ประหยัดหน่วยความจำ จากทั้งประเทศ ~4,400 สถานี)

export function getWaterSnapshot(): Promise<Snapshot<WaterStation[]>> {
  return cached("water", TTL_MS, async () =>
    parseWaterLevel(await fetchThaiwaterJson("waterlevel_load"), { provinceCodes: PROVINCE_CODES }),
  );
}

export function getRainSnapshot(): Promise<Snapshot<RainStation[]>> {
  const { lat, lng } = stationsConfig.home;
  return cached("rain", TTL_MS, async () =>
    parseRain(await fetchThaiwaterJson("rain_24h"), (s) => distanceKm(lat, lng, s.lat, s.lng) <= RAIN_KEEP_KM),
  );
}

export interface OverallResult {
  overall: OverallStatus | null;
  freshness: Freshness;
  /** อธิบายว่าคำนวณจากสถานีไหน */
  basis: "primary" | "all-nonthaburi";
  stale: boolean;
  error?: string;
  fetchedAt: string | null;
  rainNote?: string;
}

/** สถานะรวมสำหรับหน้าแรก — ไม่โยน error: ถ้าแหล่งข้อมูลล้ม จะคืน freshness:"unavailable" */
export async function getOverallStatus(): Promise<OverallResult> {
  const [water, rain] = await Promise.all([getWaterSnapshot(), getRainSnapshot()]);
  if (!water.data) {
    return { overall: null, freshness: "unavailable", basis: "all-nonthaburi", stale: false, error: water.error, fetchedAt: null };
  }
  const primary = stationsConfig.primaryWater;
  const nonthaburi = PROVINCES[0].code;
  const stations = primary.length
    ? water.data.filter((s) => primary.includes(s.id))
    : water.data.filter((s) => s.provinceCode === nonthaburi);
  const overall = computeOverall(stations, rain.data ?? [], stationsConfig.home, Date.now());
  const allObsStale = stations.length > 0 && overall.waterUsed === 0;
  return {
    overall,
    freshness: freshnessOf(true, water.stale || allObsStale),
    basis: primary.length ? "primary" : "all-nonthaburi",
    stale: water.stale,
    error: water.error,
    fetchedAt: water.fetchedAt,
    rainNote: rain.data ? undefined : "ยังไม่มีข้อมูลฝน (ไม่นำมาคำนวณ)",
  };
}

// ---------------------------------------------------------------------
// เฟส 3: เรดาร์ + พยากรณ์
// ---------------------------------------------------------------------
export interface WeatherArea {
  slug: string;
  name: string;
  province: string;
  lat: number;
  lng: number;
  approx: boolean;
}
export const weatherAreas = (weatherAreasJson as { areas: WeatherArea[] }).areas;

const RADAR_TTL_MS = Number(process.env.RADAR_CACHE_TTL_MS ?? 300_000); // 5 นาที (RainViewer อัปเดตทุก 10 นาที)
const FORECAST_TTL_MS = Number(process.env.FORECAST_CACHE_TTL_MS ?? 1_800_000); // 30 นาที

export function getRadarSnapshot(): Promise<Snapshot<RadarIndex>> {
  return cached("radar", RADAR_TTL_MS, fetchRadarIndex);
}

/** พิกัดต้องอยู่ในกรอบประเทศไทยคร่าว ๆ และปัดเหลือ 2 ตำแหน่ง (ลดจำนวน key แคช + ไม่เก็บตำแหน่งละเอียดของผู้ใช้) */
export function normalizeCoords(lat: number, lng: number): { lat: number; lng: number } | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < 5.5 || lat > 20.6 || lng < 97.3 || lng > 105.7) return null;
  return { lat: Math.round(lat * 100) / 100, lng: Math.round(lng * 100) / 100 };
}

export function getForecastSnapshot(lat: number, lng: number): Promise<Snapshot<Forecast>> {
  return cached(`forecast:${lat},${lng}`, FORECAST_TTL_MS, () => fetchForecast(lat, lng));
}

/** เวลาปัจจุบัน (ms) — แยกเป็นฟังก์ชันเพื่อให้ server component เรียกใช้ได้โดยไม่ติดกฎ "pure render" ของ lint */
export const nowMs = (): number => Date.now();

// ---------------------------------------------------------------------
// เฟส 5: เขื่อน (กรมชลประทาน) — แคช 10 นาที (ข้อมูลอัปเดตวันละครั้ง)
// ---------------------------------------------------------------------
import damsConfigJson from "@data/dams.json";
import { fetchDams, type DamsData } from "./sources/rid-dams";

export interface DamConfigItem { id: string; label: string; match: string[]; confirmed: boolean; proposal?: string }
export const damsConfig = damsConfigJson as unknown as { flowUnit: string | null; flowUnitTodo?: string; dams: DamConfigItem[] };

const DAMS_TTL_MS = Number(process.env.DAMS_CACHE_TTL_MS ?? 600_000);
export function getDamsSnapshot(): Promise<Snapshot<DamsData>> {
  return cached("dams", DAMS_TTL_MS, fetchDams);
}
