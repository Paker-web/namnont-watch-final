// จังหวัดที่เว็บนี้ติดตาม (รหัสจังหวัดตามที่ ThaiWater ส่งมาใน geocode.province_code)
export interface Province {
  slug: string;
  th: string;
  code: string;
}

export const PROVINCES: Province[] = [
  { slug: "nonthaburi", th: "นนทบุรี", code: "12" },
  { slug: "ayutthaya", th: "พระนครศรีอยุธยา", code: "14" },
  { slug: "pathumthani", th: "ปทุมธานี", code: "13" },
];

/** รับได้ทั้งชื่อไทย, slug หรือรหัสจังหวัด */
export function resolveProvince(input: string | null | undefined): Province | null {
  if (!input) return null;
  const q = input.trim().toLowerCase();
  return PROVINCES.find((p) => p.th === input.trim() || p.slug === q || p.code === q) ?? null;
}
