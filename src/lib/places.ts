import placesJson from "@data/places.json";

// ชนิดข้อมูลจุดอพยพ/ที่จอดรถ ตาม schema ของแผน (ข้อ 5) + sample (ข้อมูลตัวอย่าง)
export type PlaceType = "evacuation" | "parking" | "shelter";
export interface Place {
  id: string;
  sample?: boolean;
  name: string;
  type: PlaceType;
  owner: "government" | "private";
  province: string;
  district: string;
  subdistrict: string;
  lat: number | null;
  lng: number | null;
  address: string;
  capacity: number | null;
  is_free: boolean;
  hours: string;
  phone: string;
  flood_safe_note: string;
  source_url: string;
  verified_at: string; // YYYY-MM-DD
  verified_by: string;
  status: "open" | "closed" | "unknown";
}

export const TYPE_LABEL: Record<PlaceType, string> = { evacuation: "จุดอพยพ", shelter: "ศูนย์พักพิง", parking: "ที่จอดรถ" };
export const TYPE_LETTER: Record<PlaceType, string> = { evacuation: "อ", shelter: "พ", parking: "จ" };
export const OWNER_LABEL = { government: "ภาครัฐ", private: "เอกชน" } as const;
export const STATUS_LABEL = { open: "เปิดอยู่", closed: "ปิด", unknown: "ไม่ทราบสถานะ" } as const;

/** เฉพาะจุดที่มีพิกัด (แสดงบนแผนที่ได้) */
export const places: Place[] = (placesJson as { places: Place[] }).places.filter((p) => p.lat !== null && p.lng !== null);

/** ตรวจภายในกี่วันถึงจะถือว่า "ข้อมูลยังใหม่" (เขียว) — เกินนี้เป็นเทา "ควรโทรยืนยัน" */
export const FRESH_DAYS = 7;

export function ageDays(verifiedAt: string, nowMs: number): number {
  const t = Date.parse(`${verifiedAt}T00:00:00+07:00`);
  return Number.isNaN(t) ? Infinity : Math.max(0, Math.floor((nowMs - t) / 86_400_000));
}
