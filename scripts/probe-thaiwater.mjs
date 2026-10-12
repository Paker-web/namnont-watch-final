// รัน: npm run probe
// เรียก ThaiWater จริง 2 endpoint แล้วพิมพ์:
//  1) ตัวอย่าง response (โครงสร้าง + 1 แถว)  2) รายชื่อสถานีวัดน้ำใน นนทบุรี/อยุธยา/ปทุมธานี  3) สถานีฝนใกล้เสาธงหิน
// และบันทึก response เต็มไว้ที่ .probe/ (อย่า commit)
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";

const BASE = process.env.THAIWATER_BASE_URL ?? "https://api-v3.thaiwater.net/api/v1/thaiwater30/public";
const cfg = JSON.parse(readFileSync(new URL("../data/stations.json", import.meta.url), "utf8"));
const PROV = { "12": "นนทบุรี", "14": "พระนครศรีอยุธยา", "13": "ปทุมธานี" };

const km = (aLat, aLng, bLat, bLng) => {
  const r = (d) => (d * Math.PI) / 180, R = 6371;
  const h = Math.sin(r(bLat - aLat) / 2) ** 2 + Math.cos(r(aLat)) * Math.cos(r(bLat)) * Math.sin(r(bLng - aLng) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};
const get = (o, p) => p.split(".").reduce((c, k) => (c == null ? undefined : c[k]), o);
const rowsOf = (j) => Array.isArray(j) ? j : Object.values(j ?? {}).map((v) => (Array.isArray(v) ? v : v?.data)).find(Array.isArray);

async function load(name) {
  const res = await fetch(`${BASE}/${name}`, { headers: { Accept: "application/json", "User-Agent": "NamNonWatch-probe/0.1" } });
  console.log(`\n=== ${name}: HTTP ${res.status} ===`);
  if (res.status === 429) console.log("429 = ถูกจำกัดคำขอ รอสักครู่แล้วลองใหม่ (retry-after:", res.headers.get("retry-after"), ")");
  if (!res.ok) return null;
  const json = await res.json();
  mkdirSync(new URL("../.probe/", import.meta.url), { recursive: true });
  writeFileSync(new URL(`../.probe/${name}.json`, import.meta.url), JSON.stringify(json));
  return json;
}

const wl = await load("waterlevel_load");
if (wl) {
  const rows = wl.waterlevel_data?.data ?? [];
  console.log("top-level keys:", Object.keys(wl), "| จำนวนแถวทั่วประเทศ:", rows.length);
  console.log("ตัวอย่าง 1 แถว (ตัดให้สั้น):\n", JSON.stringify(rows[0], null, 1).slice(0, 1800));
  const home = cfg.home, pier = cfg.pier;
  for (const code of Object.keys(PROV)) {
    const list = rows.filter((r) => get(r, "geocode.province_code") === code)
      .sort((a, b) => Number(b.storage_percent ?? -1) - Number(a.storage_percent ?? -1));
    console.log(`\n--- ${PROV[code]} (${list.length} สถานี) ---`);
    console.log("id | รหัส | ชื่อ | แม่น้ำ | อำเภอ | lat,lng | %ตลิ่ง | lv | เวลา | กม.จากเสาธงหิน" + (pier.lat ? " | กม.จากท่าน้ำนนท์" : ""));
    for (const r of list) {
      const lat = get(r, "station.tele_station_lat"), lng = get(r, "station.tele_station_long");
      const d1 = lat != null ? km(home.lat, home.lng, lat, lng).toFixed(1) : "-";
      const d2 = pier.lat && lat != null ? ` | ${km(pier.lat, pier.lng, lat, lng).toFixed(1)}` : "";
      console.log([`tw-${get(r, "station.id")}`, get(r, "station.tele_station_oldcode"), get(r, "station.tele_station_name.th") ?? get(r, "station.tele_station_name.en"),
        r.river_name ?? "-", get(r, "geocode.amphoe_name.th"), `${lat},${lng}`, r.storage_percent, r.situation_level, r.waterlevel_datetime, d1].join(" | ") + d2);
    }
  }
}

const rain = await load("rain_24h");
if (rain) {
  const rows = rowsOf(rain) ?? [];
  console.log("top-level keys:", Object.keys(rain), "| จำนวนแถว:", rows.length);
  console.log("ตัวอย่าง 1 แถว (ใช้ปรับ RAIN_PATHS ใน src/lib/sources/thaiwater.ts):\n", JSON.stringify(rows[0], null, 1).slice(0, 1800));
}
console.log("\nเสร็จ — ส่งผลลัพธ์ส่วน 'ตัวอย่าง 1 แถว' ของ rain_24h และตารางสถานีนนทบุรีให้ผมได้เลย");
