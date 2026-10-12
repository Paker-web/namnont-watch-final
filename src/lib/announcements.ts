import announcementsJson from "@data/announcements.json";

// ประกาศการระบายน้ำที่สรุปโดย AI (เขียนลงไฟล์โดย scripts/update-announcements.mjs)
// หน้าเว็บแสดงเฉพาะรายการที่ needs_review = false และแสดงลิงก์ต้นฉบับกำกับเสมอ
export interface AnnouncementEntry {
  id: string;
  source_id: string;
  source_name: string;
  source_url: string;
  announced_at: string | null; // ISO 8601
  fetched_at: string; // ISO 8601
  discharge_cms: number | null; // ระบายน้ำเขื่อนเจ้าพระยา (ลบ.ม./วินาที)
  warning_text: string | null;
  model: string;
  needs_review: boolean;
  review_reasons: string[];
}
export interface AnnouncementsData {
  schema: 1;
  updated_at: string | null;
  entries: AnnouncementEntry[];
}

export const announcements = announcementsJson as unknown as AnnouncementsData;

/** ประกาศจากตัวอย่างอายุเกินกี่ชั่วโมงถือว่า "ค้าง" */
export const ANNOUNCEMENT_STALE_HOURS = 24;

/** รายการล่าสุดที่ผ่านการตรวจ (needs_review=false) และมีเนื้อหาให้แสดง */
export function latestPublishable(data: AnnouncementsData = announcements): AnnouncementEntry | null {
  const ok = data.entries.filter((e) => !e.needs_review && (e.discharge_cms !== null || e.warning_text));
  ok.sort((a, b) => (b.announced_at ?? b.fetched_at).localeCompare(a.announced_at ?? a.fetched_at));
  return ok[0] ?? null;
}
