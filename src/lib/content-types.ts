// ชนิดข้อมูลของไฟล์ JSON ในโฟลเดอร์ /data
// แก้เนื้อหาใน /data ได้เลยโดยไม่ต้องแตะโค้ด แต่ต้องคงโครงสร้างตามนี้

export interface ChecklistItem {
  id: string; // ต้องไม่ซ้ำกัน และอย่าเปลี่ยนภายหลัง (ใช้จำว่าติ๊กอันไหนแล้ว)
  text: string;
  detail?: string;
}
export interface ChecklistGroup {
  title: string;
  items: ChecklistItem[];
}
export interface PrepareTab {
  id: string;
  label: string;
  groups: ChecklistGroup[];
}
export interface PrepareData {
  reviewStatus: "draft" | "reviewed";
  reviewNote?: string;
  tabs: PrepareTab[];
}

export interface Contact {
  id: string;
  name: string;
  number: string | null; // null = ยังไม่มีข้อมูล
  description?: string;
  todo?: string; // โน้ตถึงเจ้าของเว็บ (แสดงเฉพาะตอนพัฒนา)
}
export interface CallScript {
  intro: string;
  steps: { id: string; title: string; detail: string }[];
  example: string;
  tips: string[];
}
export interface ContactsData {
  national: Contact[];
  local: Contact[];
  callScript: CallScript;
}

export interface DataSource {
  id: string;
  name: string;
  url: string;
  usedFor: string;
  verified: boolean; // false = ยังไม่ได้ตรวจลิงก์
  todo?: string;
}
export interface SourcesData {
  sources: DataSource[];
}

export interface StationsConfig {
  home: { name: string; lat: number; lng: number; verified: boolean };
  pier: { name: string; lat: number | null; lng: number | null };
  /** id สถานีหลัก เช่น "tw-26" (ว่าง = ใช้ทุกสถานีในนนทบุรีชั่วคราว) */
  primaryWater: string[];
  rainRadiusKm: number;
}

export interface LinkItem {
  id: string;
  title: string;
  url: string | null;
  todo?: string;
  verified?: boolean;
}
export interface LinksData {
  links: LinkItem[];
}
