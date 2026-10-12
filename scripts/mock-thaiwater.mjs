// เซิร์ฟเวอร์จำลอง ThaiWater สำหรับทดสอบ "ตัดเน็ต/429" โดยไม่ต้องใช้เน็ตจริง
// รัน: npm run mock           (พอร์ต 4010)
// แล้วรันเว็บ: THAIWATER_BASE_URL=http://localhost:4010 npm run dev
// สลับโหมดระหว่างรัน:  curl localhost:4010/__mode/ok | /429 | /500 | /hang
// ดูจำนวนครั้งที่ถูกเรียก: curl localhost:4010/__stats
// หมายเหตุ: fixtures/waterlevel.json ตัดมาจาก response จริง; fixtures/rain.synthetic.json เป็นข้อมูลสังเคราะห์
//          (schema เดา) ใช้ทดสอบ pipeline เท่านั้น ห้ามนำไปแสดงเป็นข้อมูลจริง
import http from "node:http";
import { readFileSync } from "node:fs";
// ปรับเวลาในข้อมูลทดสอบให้เป็น "10 นาทีที่แล้ว" (เวลาไทย) เสมอ เพื่อให้ถูกนับเป็นข้อมูลสด
const bkk = () => new Date(Date.now() + 7 * 3600_000 - 10 * 60_000).toISOString().slice(0, 16).replace("T", " ");
const load = (f) => readFileSync(new URL(`./fixtures/${f}`, import.meta.url), "utf8").replace(/"2026-09-30 \d\d:\d\d"/g, `"${bkk()}"`);
// ---- ข้อมูลสังเคราะห์ตามเอกสารของแต่ละแหล่ง (RainViewer / Open-Meteo / กรมชลประทาน) — ใช้ทดสอบ pipeline เท่านั้น ----
const rainviewer = () => {
  const now = Math.floor(Date.now() / 600_000) * 600;
  return { version: "2.0", generated: now, host: "http://localhost:4010", radar: { past: Array.from({ length: 13 }, (_, i) => ({ time: now - (12 - i) * 600, path: `/v2/radar/${now - (12 - i) * 600}` })), nowcast: [] } };
};
const openmeteo = () => {
  const start = new Date(Date.UTC(...new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10).split("-").map((v, i) => (i === 1 ? Number(v) - 1 : Number(v)))));
  const hours = Array.from({ length: 168 }, (_, i) => new Date(start.getTime() + i * 3600_000).toISOString().slice(0, 13) + ":00");
  const nowIdx = hours.findIndex((h) => h >= new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 13) + ":00");
  const rain = (i) => (i - nowIdx >= 2 && i - nowIdx <= 4 ? [1.2, 4.8, 2.0][i - nowIdx - 2] : 0);
  const days = Array.from({ length: 7 }, (_, i) => new Date(start.getTime() + i * 86400_000).toISOString().slice(0, 10));
  return {
    latitude: 13.88, longitude: 100.41, timezone: "Asia/Bangkok",
    hourly: { time: hours, precipitation_probability: hours.map((_, i) => (rain(i) ? 70 : 10)), precipitation: hours.map((_, i) => rain(i)), wind_speed_10m: hours.map(() => 8), wind_gusts_10m: hours.map(() => 18) },
    daily: { time: days, precipitation_sum: days.map(() => 8.0), precipitation_probability_max: days.map(() => 70), wind_speed_10m_max: days.map(() => 15), temperature_2m_max: days.map(() => 33), temperature_2m_min: days.map(() => 26) },
  };
};
const dams = () => ({ date: new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10), total: 3, data: [
  { region: "ภาคเหนือ", dams: [{ id: 1, name: "เขื่อนภูมิพล", capacity: 13462, storage: 9000, volume: 9000, percent_storage: 66.9, inflow: 55.5, outflow: 20.1 }, { id: 2, name: "เขื่อนสิริกิติ์", capacity: 9510, storage: 8000, volume: 8000, percent_storage: 84.1, inflow: 30, outflow: 25 }] },
  { region: "ภาคกลาง", dams: [{ id: 3, name: "เขื่อนป่าสักชลสิทธิ์", capacity: 960, storage: 700, volume: 700, percent_storage: 72.9, inflow: 5, outflow: 3 }] }] });

let mode = "ok";
const calls = { waterlevel_load: 0, rain_24h: 0, "rainviewer.json": 0, forecast: 0, dam: 0 };
http.createServer((req, res) => {
  const u = new URL(req.url, "http://x");
  if (u.pathname.startsWith("/__mode/")) { mode = u.pathname.split("/")[2]; res.end(`mode=${mode}\n`); return; }
  if (u.pathname === "/__stats") { res.end(JSON.stringify({ mode, calls }) + "\n"); return; }
  const name = u.pathname.split("/").pop();
  if (!(name in calls)) { res.statusCode = 404; res.end("not found"); return; }
  const synthetic = { "rainviewer.json": rainviewer, forecast: openmeteo, dam: dams }[name];
  calls[name]++;
  if (mode === "429") { res.statusCode = 429; res.setHeader("Retry-After", "60"); res.end("Too Many Requests"); return; }
  if (mode === "500") { res.statusCode = 500; res.end("boom"); return; }
  if (mode === "hang") return; // ไม่ตอบ → ทดสอบ timeout
  res.setHeader("Content-Type", "application/json");
  if (synthetic) { res.end(JSON.stringify(synthetic())); return; }
  res.end(load(name === "rain_24h" ? "rain.synthetic.json" : "waterlevel.json"));
}).listen(4010, () => console.log("mock ThaiWater at http://localhost:4010  (โหมด: ok)"));
