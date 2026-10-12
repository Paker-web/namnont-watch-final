import type { HourlyPoint } from "./sources/openmeteo";

// สรุป "ฝน 6 ชั่วโมงข้างหน้า" เป็นภาษาไทยง่าย ๆ จากข้อมูลพยากรณ์ — แก้เกณฑ์ได้ที่นี่
// TODO (เจ้าของเว็บ): เกณฑ์เหล่านี้เป็นค่าเริ่มต้นชั่วคราว ไม่ใช่เกณฑ์ทางการของกรมอุตุฯ
export const RAIN_RULES = {
  hours: 6,
  /** ถ้าโอกาสฝนสูงสุดต่ำกว่านี้ และฝนรวมน้อยกว่า dryTotalMm → "ไม่น่ามีฝน" */
  dryProb: 30,
  dryTotalMm: 0.5,
  /** ความแรงฝนต่อชั่วโมง (มม./ชม.) */
  moderateMmPerHour: 2.5,
  heavyMmPerHour: 7.5,
  veryHeavyMmPerHour: 15,
};

export interface RainOutlook {
  text: string;
  maxProb: number | null;
  totalMm: number;
  peakMmPerHour: number;
}

const hhmm = (iso: string) => iso.slice(11, 16);

export function summarizeNextHours(hourly: HourlyPoint[]): RainOutlook {
  const r = RAIN_RULES;
  const next = hourly.slice(0, r.hours);
  const probs = next.map((h) => h.precipProb).filter((v): v is number => v !== null);
  const maxProb = probs.length ? Math.max(...probs) : null;
  const totalMm = next.reduce((s, h) => s + (h.precipMm ?? 0), 0);
  const peak = next.reduce((p, h) => ((h.precipMm ?? 0) > (p.precipMm ?? 0) ? h : p), next[0]);
  const peakMm = peak?.precipMm ?? 0;

  if (!next.length || (maxProb === null && totalMm === 0)) {
    return { text: "ยังไม่มีข้อมูลพยากรณ์ฝนพอจะสรุป", maxProb, totalMm, peakMmPerHour: peakMm };
  }
  if ((maxProb ?? 0) < r.dryProb && totalMm < r.dryTotalMm) {
    return { text: `ฝนน่าจะไม่ตกใน ${r.hours} ชั่วโมงข้างหน้า`, maxProb, totalMm, peakMmPerHour: peakMm };
  }
  const intensity =
    peakMm >= r.veryHeavyMmPerHour ? "ฝนหนักมาก" : peakMm >= r.heavyMmPerHour ? "ฝนหนัก" : peakMm >= r.moderateMmPerHour ? "ฝนปานกลาง" : "ฝนเล็กน้อย";
  const when = peakMm > 0 ? ` หนักที่สุดราว ${hhmm(peak.time)} น.` : "";
  const prob = maxProb !== null ? ` โอกาสฝนสูงสุด ${Math.round(maxProb)}%` : "";
  return {
    text: `${r.hours} ชั่วโมงข้างหน้า: ${intensity} คาดฝนรวมประมาณ ${totalMm.toFixed(1)} มม.${when}${prob}`,
    maxProb,
    totalMm,
    peakMmPerHour: peakMm,
  };
}
