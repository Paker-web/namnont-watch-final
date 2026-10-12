import { distanceKm } from "./geo";
import type { Freshness, RainStation, SituationLevel, WaterStation } from "./types";

// =====================================================================
// กติกาคำนวณสถานะ — แก้เกณฑ์ทั้งหมดได้ที่ไฟล์นี้ไฟล์เดียว
//
// TODO (เจ้าของเว็บ): ค่าด้านล่างเป็น "ค่าเริ่มต้นชั่วคราว" ที่ผมตั้งไว้เพื่อให้ระบบทำงาน
// ไม่ใช่เกณฑ์ทางการ ควรตรวจกับเกณฑ์ของ ปภ./กรมชลประทาน แล้วปรับให้เหมาะกับพื้นที่
// =====================================================================
export const STATUS_RULES = {
  /**
   * ระดับน้ำเป็น % ของความลึกถึงตลิ่ง (storage_percent จาก ThaiWater, 100 = เสมอตลิ่ง)
   * ตั้งแต่ค่านี้ขึ้นไปจึงเป็นระดับนั้น
   */
  bankPercent: { watch: 70, warning: 90, critical: 100 },

  /**
   * ถ้าสถานีไม่มี % ตลิ่ง ใช้ situation_level (1–5) ของ ThaiWater แทน
   * (5 = ล้นตลิ่ง; จากข้อมูลจริงที่เห็น 4 = ใกล้ตลิ่ง) — ตั้งฝั่งระวังไว้ก่อน
   */
  situationCodeFallback: { 1: "ok", 2: "ok", 3: "ok", 4: "warning", 5: "critical" } as Record<number, SituationLevel>,

  /** ข้อมูลที่วัดนานเกินกี่นาทีถือว่า "ค้าง" และไม่นำไปคำนวณสถานะรวม
   *  (ข้อมูลจริงมีบางสถานีค้างเป็นวัน) */
  staleAfterMinutes: { water: 180, rain: 180 },

  /** ฝนสะสม 24 ชม. (มม.) — ค่าอ้างอิงจากเกณฑ์ที่โปรเจกต์อื่นรายงานว่าเป็นของกรมอุตุฯ (ยังไม่ยืนยัน) */
  rain24hMm: { watch: 35, warning: 90, critical: 150 },

  /** ฝนอย่างเดียวส่งผลต่อสถานะรวมได้สูงสุดเท่านี้ (ไม่ให้ฝนอย่างเดียวขึ้น "วิกฤต") */
  rainMaxContribution: "watch" as SituationLevel,

  /** รัศมี (กม.) รอบพิกัดเสาธงหินที่นับฝนเข้าสถานะรวม */
  rainRadiusKm: 15,
};

const ORDER: SituationLevel[] = ["ok", "watch", "warning", "critical"];
const rank = (l: SituationLevel) => ORDER.indexOf(l);
export const maxLevel = (a: SituationLevel, b: SituationLevel) => (rank(a) >= rank(b) ? a : b);
const minLevel = (a: SituationLevel, b: SituationLevel) => (rank(a) <= rank(b) ? a : b);

/** ระดับของสถานีวัดน้ำหนึ่งสถานี (null = ไม่มีข้อมูลพอ) */
export function waterLevelOf(st: WaterStation): SituationLevel | null {
  const p = st.bankPercent;
  if (p !== null) {
    const r = STATUS_RULES.bankPercent;
    return p >= r.critical ? "critical" : p >= r.warning ? "warning" : p >= r.watch ? "watch" : "ok";
  }
  if (st.situationCode !== null) return STATUS_RULES.situationCodeFallback[st.situationCode] ?? null;
  return null;
}

export function rainLevelOf(mm: number): SituationLevel {
  const r = STATUS_RULES.rain24hMm;
  return mm >= r.critical ? "critical" : mm >= r.warning ? "warning" : mm >= r.watch ? "watch" : "ok";
}

/** เวลาที่วัดเก่าเกินเกณฑ์ (หรือไม่มีเวลา) = ค้าง */
export function observationStale(observedAt: string | null, kind: "water" | "rain", nowMs: number): boolean {
  if (!observedAt) return true;
  const t = Date.parse(observedAt);
  if (Number.isNaN(t)) return true;
  return nowMs - t > STATUS_RULES.staleAfterMinutes[kind] * 60_000;
}

/** เรียงสถานีตามความเสี่ยง: % ตลิ่งสูงสุดก่อน (ไม่มีค่าไว้ท้าย) */
export function byRisk(a: WaterStation, b: WaterStation): number {
  return (b.bankPercent ?? -1) - (a.bankPercent ?? -1);
}

export interface OverallStatus {
  level: SituationLevel | null; // null = ไม่มีข้อมูลสดพอจะสรุป
  waterUsed: number;
  waterSkippedStale: number;
  worst: WaterStation | null;
  rainMaxMm: number | null;
  rainStationName: string | null;
  newestObservedAt: string | null;
}

/** สถานะรวม: ระดับสูงสุดของสถานีน้ำที่ "ข้อมูลยังสด" + ฝน (จำกัดเพดานตาม rainMaxContribution) */
export function computeOverall(
  waters: WaterStation[],
  rains: RainStation[],
  home: { lat: number; lng: number },
  nowMs: number,
): OverallStatus {
  let level: SituationLevel | null = null;
  let worst: WaterStation | null = null;
  let used = 0;
  let skipped = 0;
  let newest: string | null = null;

  for (const st of waters) {
    if (observationStale(st.observedAt, "water", nowMs)) {
      skipped++;
      continue;
    }
    const lv = waterLevelOf(st);
    if (lv === null) continue;
    used++;
    level = level === null ? lv : maxLevel(level, lv);
    if (!worst || (st.bankPercent ?? -1) > (worst.bankPercent ?? -1)) worst = st;
    if (st.observedAt && (!newest || st.observedAt > newest)) newest = st.observedAt;
  }

  // ฝน: สถานีสดที่อยู่ในรัศมี
  let rainMax: RainStation | null = null;
  for (const r of rains) {
    if (observationStale(r.observedAt, "rain", nowMs)) continue;
    if (distanceKm(home.lat, home.lng, r.lat, r.lng) > STATUS_RULES.rainRadiusKm) continue;
    if (!rainMax || r.rain24hMm > rainMax.rain24hMm) rainMax = r;
  }
  if (rainMax && level !== null) {
    level = maxLevel(level, minLevel(rainLevelOf(rainMax.rain24hMm), STATUS_RULES.rainMaxContribution));
  }

  return {
    level,
    waterUsed: used,
    waterSkippedStale: skipped,
    worst,
    rainMaxMm: rainMax?.rain24hMm ?? null,
    rainStationName: rainMax?.name ?? null,
    newestObservedAt: newest,
  };
}

/** ความสดรวมของชุดข้อมูล สำหรับป้าย สด/ค้าง/ไม่พร้อมใช้งาน */
export function freshnessOf(hasData: boolean, stale: boolean): Freshness {
  return !hasData ? "unavailable" : stale ? "stale" : "live";
}
