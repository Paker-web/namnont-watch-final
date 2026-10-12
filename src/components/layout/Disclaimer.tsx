import { Info } from "lucide-react";

// ข้อความ disclaimer ที่ต้องมีทุกหน้า (ถูกใส่ใน Footer ซึ่งอยู่ใน layout หลัก)
export const DISCLAIMER_TEXT =
  "เว็บนี้รวบรวมข้อมูลจากแหล่งทางการเพื่ออำนวยความสะดวก ไม่ใช่ประกาศเตือนภัยอย่างเป็นทางการ โปรดตรวจสอบกับ ปภ. โทร 1784";

export function Disclaimer() {
  return (
    <p className="flex gap-2 rounded-control border-2 border-line bg-surface-2 p-3 text-base">
      <Info className="mt-1 h-5 w-5 shrink-0" aria-hidden />
      <span>{DISCLAIMER_TEXT}</span>
    </p>
  );
}
