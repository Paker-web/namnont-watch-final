// ตัวช่วยอ่านค่าจาก JSON ที่ไม่รู้โครงสร้างแน่ชัด โดยไม่ใช้ any
export function dig(root: unknown, path: string): unknown {
  let cur: unknown = root;
  for (const key of path.split(".")) {
    if (cur === null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur;
}

/** ลองหลายเส้นทาง (path) คืนค่าแรกที่ไม่ว่าง */
export function digFirst(root: unknown, paths: string[]): unknown {
  for (const p of paths) {
    const v = dig(root, p);
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
}

/** แปลงเป็นตัวเลข: รับได้ทั้ง number และ string เช่น "52.90" */
export function toNum(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function toStr(v: unknown): string | null {
  if (typeof v === "string") return v.trim() || null;
  if (typeof v === "number") return String(v);
  return null;
}
