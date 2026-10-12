// ชนิดข้อมูลกลางที่ทั้งเว็บใช้ร่วมกัน
// (adapter ในเฟส 3–4 จะแปลงข้อมูลจากแต่ละแหล่งให้เป็นชนิดเหล่านี้)

/** ระดับสถานการณ์ 4 ระดับ: ปกติ / เฝ้าระวัง / เตือนภัย / วิกฤต */
export type SituationLevel = "ok" | "watch" | "warning" | "critical";

/** ความสดของข้อมูล: สด / ค้าง (ใช้ข้อมูลแคชเก่า) / ไม่พร้อมใช้งาน */
export type Freshness = "live" | "stale" | "unavailable";

/** แหล่งที่มาของข้อมูล */
export interface SourceRef {
  name: string;
  url?: string;
}

// ---------------------------------------------------------------------
// เฟส 2: ชนิดข้อมูลกลางของสถานีวัดระดับน้ำ / ฝน
// adapter (src/lib/sources/*.ts) ต้องแปลงข้อมูลทุกแหล่งให้เป็นชนิดเหล่านี้
// ---------------------------------------------------------------------

export type Trend = "rising" | "falling" | "steady";

/** รหัสสถานการณ์ของ ThaiWater (1–5) ที่ส่งมาใน situation_level */
export type SituationCode = 1 | 2 | 3 | 4 | 5;

export interface WaterStation {
  id: string; // เช่น "tw-26"
  code: string | null; // รหัสสถานีเดิม เช่น "CPY014"
  name: string;
  river: string | null;
  provinceCode: string;
  province: string;
  amphoe: string | null;
  tambon: string | null;
  lat: number | null;
  lng: number | null;
  /** ระดับน้ำ (ม.รทก.) */
  levelMsl: number | null;
  /** ระดับน้ำครั้งก่อนหน้า (ม.รทก.) ใช้คำนวณแนวโน้ม */
  previousMsl: number | null;
  trend: Trend | null;
  /** ระดับตลิ่งด้านต่ำ (ม.รทก.) */
  bankMsl: number | null;
  /** ต่างจากตลิ่ง (ม.) บวก = ล้นตลิ่ง, ลบ = ต่ำกว่าตลิ่ง */
  diffBankM: number | null;
  /** ระดับน้ำเป็น % ของความลึกถึงตลิ่ง (จากท้องน้ำ) — 100 = เสมอตลิ่ง */
  bankPercent: number | null;
  situationCode: SituationCode | null;
  discharge: number | null;
  /** เวลาที่สถานีวัด (ISO 8601 พร้อม +07:00) */
  observedAt: string | null;
  agency: string | null;
  isKeyStation: boolean;
}

export interface RainStation {
  id: string;
  name: string;
  provinceCode: string | null;
  province: string | null;
  amphoe: string | null;
  lat: number;
  lng: number;
  /** ฝนสะสม 24 ชม. (มม.) */
  rain24hMm: number;
  observedAt: string | null;
}

/** ผลที่ได้จากแคช: ข้อมูล + ความสด */
export interface Snapshot<T> {
  data: T | null;
  fetchedAt: string | null;
  /** true = ดึงข้อมูลใหม่ไม่สำเร็จ กำลังใช้ข้อมูลที่แคชไว้ */
  stale: boolean;
  error?: string;
  /** เวลาที่ระบบจะลองดึงใหม่ (ระหว่าง backoff) */
  retryAt?: string | null;
}
