// ตรวจ data/places.json ก่อน build (npm run build จะเรียกอัตโนมัติผ่าน "prebuild")
// ตรวจ: ฟิลด์ครบ/ชนิดถูก · ค่า enum · พิกัดอยู่ในไทย · id ไม่ซ้ำ · ไม่มีจุดพิกัดซ้ำกัน · รูปแบบวันที่
// ข้อมูลจริง (ไม่ใช่ sample) ต้องมี source_url, verified_by และพิกัดไม่เป็น null
// ถ้าผิด → พิมพ์รายการข้อผิดพลาดแล้ว exit 1 (build จะไม่ผ่าน)
// หมายเหตุ: แผนเดิมระบุไฟล์ .ts — ใช้ .mjs เพื่อรันได้ด้วย node ตรง ๆ ไม่ต้องติดตั้งเครื่องมือเพิ่ม
import { readFileSync } from "node:fs";

const file = new URL("../data/places.json", import.meta.url);
const { places } = JSON.parse(readFileSync(file, "utf8"));
const TYPES = ["evacuation", "parking", "shelter"];
const OWNERS = ["government", "private"];
const STATUSES = ["open", "closed", "unknown"];
const errors = [];
const err = (id, msg) => errors.push(`  • ${id}: ${msg}`);

// กรอบประเทศไทยคร่าว ๆ
const inThailand = (lat, lng) => lat >= 5.5 && lat <= 20.6 && lng >= 97.3 && lng <= 105.7;
const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
const str = (v) => typeof v === "string";

if (!Array.isArray(places)) { console.error("places.json: ต้องมี places เป็น array"); process.exit(1); }

const ids = new Set();
const coords = new Map();
for (const p of places) {
  const id = p?.id ?? "(ไม่มี id)";
  if (!str(p.id) || !p.id) err(id, "ต้องมี id");
  if (ids.has(p.id)) err(id, "id ซ้ำ");
  ids.add(p.id);
  if (!str(p.name) || !p.name.trim()) err(id, "ต้องมี name");
  if (!TYPES.includes(p.type)) err(id, `type ต้องเป็น ${TYPES.join("|")}`);
  if (!OWNERS.includes(p.owner)) err(id, `owner ต้องเป็น ${OWNERS.join("|")}`);
  if (!STATUSES.includes(p.status)) err(id, `status ต้องเป็น ${STATUSES.join("|")}`);
  if (typeof p.is_free !== "boolean") err(id, "is_free ต้องเป็น true/false");
  for (const k of ["province", "district", "subdistrict", "address", "hours", "phone", "flood_safe_note", "source_url", "verified_by"]) {
    if (!str(p[k])) err(id, `${k} ต้องเป็นข้อความ (ใช้ "" ถ้าไม่มี)`);
  }
  if (p.capacity !== null && !(Number.isInteger(p.capacity) && p.capacity >= 0)) err(id, "capacity ต้องเป็นจำนวนเต็ม ≥ 0 หรือ null");
  if (!isDate(p.verified_at)) err(id, "verified_at ต้องเป็น YYYY-MM-DD");
  if (str(p.verified_at) && Date.parse(p.verified_at) > Date.now() + 86400000) err(id, "verified_at เป็นวันในอนาคต");

  const hasCoords = typeof p.lat === "number" && typeof p.lng === "number";
  if (p.lat === null || p.lng === null) {
    if (!p.sample) err(id, "จุดจริงต้องมีพิกัด (ห้ามเดา — ตรวจใน Google Maps)");
  } else if (!hasCoords) err(id, "lat/lng ต้องเป็นตัวเลขหรือ null");
  else if (!inThailand(p.lat, p.lng)) err(id, `พิกัด ${p.lat},${p.lng} อยู่นอกประเทศไทย`);
  else {
    const key = `${p.lat.toFixed(4)},${p.lng.toFixed(4)}`;
    if (coords.has(key)) err(id, `พิกัดซ้ำกับ ${coords.get(key)}`);
    coords.set(key, id);
  }
  if (!p.sample) {
    if (!p.source_url || !/^https?:\/\//.test(p.source_url)) err(id, "จุดจริงต้องมี source_url (http/https)");
    if (!p.verified_by.trim()) err(id, "จุดจริงต้องมี verified_by");
  }
}

const samples = places.filter((p) => p.sample).length;
if (errors.length) {
  console.error(`✗ places.json ไม่ผ่านการตรวจ (${errors.length} ข้อ):\n${errors.join("\n")}`);
  process.exit(1);
}
console.log(`✓ places.json ผ่าน: ${places.length} จุด (ตัวอย่าง ${samples}, จริง ${places.length - samples})`);
if (samples > 0) console.log("  ⚠ ยังมีข้อมูลตัวอย่าง — ต้องลบ/แทนที่ด้วยจุดที่ตรวจสอบแล้วก่อนเปิดใช้จริง");
