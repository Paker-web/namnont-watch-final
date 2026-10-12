import { SchemaError, UpstreamError } from "@/lib/errors";
import { dig, toNum, toStr } from "@/lib/json";

// =====================================================================
// Adapter: API เขื่อน/อ่างเก็บน้ำขนาดใหญ่ ของกรมชลประทาน (เอกสารทางการ: app.rid.go.th/reservoir/api/document/dam)
// ฟิลด์ตามเอกสาร: date, region, id, name, owner, capacity, storage, active_storage, dead_storage,
//                 volume, percent_storage, inflow, outflow   (ปริมาณเป็นล้าน ลบ.ม.)
// สถานะ: เขียนตามเอกสาร — ยังไม่ได้ทดสอบกับ API จริงจาก sandbox (เข้าไม่ถึงโดเมนนี้)
//        โครงสร้างการซ้อน (จัดกลุ่มตามภาคหรือไม่) ไม่ทราบแน่ชัด จึงใช้ตัวค้นหาแบบ "หาออบเจ็กต์ที่มี name + ค่าความจุ"
//        ไม่ว่าจะซ้อนลึกแค่ไหน — ถ้าไม่เจอเขื่อนเลย จะโยน SchemaError (ไม่เดา)
// หน่วยของ inflow/outflow ในเอกสารไม่ได้ระบุ → ดู data/dams.json (flowUnit) ให้คุณยืนยัน
// =====================================================================

export const RID_DAM_URL = process.env.RID_DAM_URL ?? "https://app.rid.go.th/reservoir/api/dam/public";
export const RID_SOURCE = { name: "กรมชลประทาน (รายงานอ่างเก็บน้ำ)", url: "https://app.rid.go.th/reservoir" };

export interface DamReading {
  id: string | null;
  name: string;
  region: string | null;
  capacityMcm: number | null;
  storageMcm: number | null;
  volumeMcm: number | null;
  percentStorage: number | null;
  inflow: number | null;
  outflow: number | null;
}
export interface DamsData {
  date: string | null; // YYYY-MM-DD (วันที่ของรายงาน)
  dams: DamReading[];
}

function collect(node: unknown, region: string | null, out: DamReading[], depth = 0) {
  if (depth > 6 || node === null || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const n of node) collect(n, region, out, depth + 1);
    return;
  }
  const obj = node as Record<string, unknown>;
  const name = toStr(obj.name);
  const looksLikeDam = name && ("percent_storage" in obj || "storage" in obj || "capacity" in obj);
  const reg = toStr(obj.region) ?? region;
  if (looksLikeDam) {
    out.push({
      id: toStr(obj.id),
      name,
      region: reg,
      capacityMcm: toNum(obj.capacity),
      storageMcm: toNum(obj.storage),
      volumeMcm: toNum(obj.volume),
      percentStorage: toNum(obj.percent_storage),
      inflow: toNum(obj.inflow),
      outflow: toNum(obj.outflow),
    });
    return;
  }
  for (const v of Object.values(obj)) collect(v, reg, out, depth + 1);
}

export function parseDams(json: unknown): DamsData {
  const dams: DamReading[] = [];
  collect(json, null, dams);
  if (dams.length === 0) throw new SchemaError("API เขื่อน: ไม่พบรายการเขื่อนใน response");
  const date = toStr(dig(json, "date")) ?? toStr(dig(json, "data.date"));
  const m = date?.match(/^(\d{4}-\d{2}-\d{2})/);
  return { date: m ? m[1] : null, dams };
}

export async function fetchDams(): Promise<DamsData> {
  let res: Response;
  try {
    res = await fetch(RID_DAM_URL, { headers: { Accept: "application/json", "User-Agent": "NamNonWatch/0.1 (flood info site; non-commercial)" }, signal: AbortSignal.timeout(15_000), cache: "no-store" });
  } catch {
    throw new UpstreamError("เชื่อมต่อกรมชลประทานไม่ได้", null);
  }
  if (!res.ok) throw new UpstreamError(`กรมชลประทานตอบ HTTP ${res.status}`, res.status);
  try {
    return parseDams(await res.json());
  } catch (e) {
    if (e instanceof SchemaError) throw e;
    throw new SchemaError("API เขื่อนไม่ใช่ JSON");
  }
}
