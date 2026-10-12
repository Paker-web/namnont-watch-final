// ดึงข้อความจากหน้าประกาศ (URL ที่คุณยืนยันแล้วใน data/sources.json) → ให้ Gemini สรุปเป็น JSON → ตรวจด้วย zod + กติกาความผิดปกติ
// → เขียน data/announcements.json (รายการที่ผิดปกติติด needs_review:true ไม่ขึ้นหน้าเว็บ)
//
// รัน: GEMINI_API_KEY=... node scripts/update-announcements.mjs
// ทดสอบแบบไม่ใช้เน็ต: --fixture-dir=<โฟลเดอร์ที่มี <id>.html และ <id>.llm.json> --sources=<ไฟล์> --out=<ไฟล์>
// ตัวเลือก: --dry (ไม่เขียนไฟล์)   ตัวแปร: GEMINI_MODEL (ค่าเริ่มต้น gemini-2.5-flash — ตรวจชื่อรุ่น/โควตาฟรีล่าสุดใน Google AI Studio)
//
// กติกา: ถ้าดึง/สรุปไม่ได้ ให้ข้ามและคงค่าเดิม (exit 0) · เคารพ robots.txt · ไม่ทำงานกับ URL ที่ยังไม่ confirmed
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ZodError } from "zod";
import { assess, buildPrompt, htmlToText, normalizeDate, parseLlmJson, robotsAllows, sameContent } from "./lib/announcements-core.mjs";

const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split("=").slice(1).join("=");
const DRY = process.argv.includes("--dry");
const FIXTURES = arg("fixture-dir");
const SOURCES = arg("sources") ?? new URL("../data/sources.json", import.meta.url).pathname;
const OUT = arg("out") ?? new URL("../data/announcements.json", import.meta.url).pathname;
const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
const KEY = process.env.GEMINI_API_KEY;
const UA = "NamNonWatch/0.1 (flood info site; non-commercial)";
const MAX_ENTRIES = 40;

const log = (...a) => console.log("[announcements]", ...a);

async function fetchText(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "text/html" }, signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const type = res.headers.get("content-type") ?? "";
  if (!/html|text/i.test(type)) throw new Error(`ชนิดไฟล์ไม่รองรับ (${type}) — ต้องเป็นหน้า HTML`);
  return htmlToText(await res.text());
}

async function robotsOk(url) {
  const u = new URL(url);
  try {
    const res = await fetch(`${u.origin}/robots.txt`, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return true; // ไม่มี robots.txt = ไม่มีข้อห้าม
    return robotsAllows(await res.text(), u.pathname + u.search);
  } catch {
    return true; // อ่าน robots ไม่ได้ ไม่ถือว่าถูกห้าม แต่เราดึงแค่หน้าเดียวในความถี่ต่ำ
  }
}

async function askGemini(prompt) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": KEY },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0, responseMimeType: "application/json" } }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
  const json = await res.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== "string") throw new Error("Gemini ไม่ส่งข้อความกลับมา");
  return text;
}

const data = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : { schema: 1, updated_at: null, entries: [] };
const sources = (JSON.parse(readFileSync(SOURCES, "utf8")).announcementSources?.items ?? []).filter((s) => s.confirmed && s.url);

if (sources.length === 0) {
  log("ยังไม่มี URL ที่ยืนยัน (confirmed:true) ใน data/sources.json → ข้าม (คงค่าเดิม)");
  process.exit(0);
}
if (!FIXTURES && !KEY) {
  log("ไม่มี GEMINI_API_KEY → ข้าม (คงค่าเดิม)");
  process.exit(0);
}

let changed = false;
for (const s of sources) {
  try {
    let text, raw;
    if (FIXTURES) {
      text = htmlToText(readFileSync(join(FIXTURES, `${s.id}.html`), "utf8"));
      raw = readFileSync(join(FIXTURES, `${s.id}.llm.json`), "utf8");
    } else {
      if (!(await robotsOk(s.url))) { log(`${s.id}: robots.txt ไม่อนุญาต → ข้าม`); continue; }
      text = await fetchText(s.url);
      if (text.length < 80) { log(`${s.id}: ข้อความสั้นเกินไป (หน้าอาจเป็นรูป/โหลดด้วย JavaScript) → ข้าม`); continue; }
      raw = await askGemini(buildPrompt(text, s.url));
    }

    const parsed = parseLlmJson(raw);
    const announcedIso = normalizeDate(parsed.announced_at);
    const previousOk = [...data.entries].reverse().find((e) => e.source_id === s.id && !e.needs_review && e.discharge_cms !== null);
    const reasons = assess({ parsed: { ...parsed, announced_at: announcedIso ?? parsed.announced_at }, text, previousOk });

    const candidate = { discharge_cms: parsed.discharge_cms, announced_at: announcedIso, warning_text: parsed.warning_text };
    const last = [...data.entries].reverse().find((e) => e.source_id === s.id);
    if (sameContent(candidate, last)) { log(`${s.id}: ไม่มีการเปลี่ยนแปลง`); continue; }

    const fetchedAt = new Date().toISOString();
    data.entries.push({
      id: `${s.id}-${fetchedAt.replace(/\D/g, "").slice(0, 14)}`,
      source_id: s.id,
      source_name: s.name,
      source_url: s.url, // ลิงก์ต้นฉบับ (ใช้ URL ที่เรายืนยัน ไม่ใช้ที่ AI ตอบมา)
      ...candidate,
      fetched_at: fetchedAt,
      model: FIXTURES ? "fixture" : MODEL,
      needs_review: reasons.length > 0,
      review_reasons: reasons,
    });
    changed = true;
    log(`${s.id}: บันทึกรายการใหม่${reasons.length ? ` ⚠ needs_review: ${reasons.join("; ")}` : " ✓"}`);
  } catch (e) {
    const msg = e instanceof ZodError ? "AI ตอบรูปแบบไม่ตรง schema" : e instanceof Error ? e.message : String(e);
    log(`${s.id}: ข้าม (${msg}) — คงค่าเดิม`);
  }
}

if (changed && !DRY) {
  data.entries = data.entries.slice(-MAX_ENTRIES);
  data.updated_at = new Date().toISOString();
  writeFileSync(OUT, JSON.stringify(data, null, 2) + "\n");
  log(`เขียน ${OUT}`);
} else {
  log(changed ? "(dry run — ไม่เขียนไฟล์)" : "ไม่มีการเปลี่ยนแปลง ไม่เขียนไฟล์");
}
