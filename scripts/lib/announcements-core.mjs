// ฟังก์ชันหลักของสคริปต์ดึงประกาศ + AI สรุป (แยกออกมาเพื่อทดสอบได้โดยไม่ต้องใช้เน็ต/คีย์)
import { z } from "zod";

// เกณฑ์ตรวจความผิดปกติ — แก้ได้ที่นี่ (ค่าเริ่มต้นชั่วคราว ให้เจ้าของเว็บตรวจ)
export const LIMITS = {
  minCms: 0,
  maxCms: 4000, // ลบ.ม./วินาที เกินนี้ถือว่าผิดปกติ ให้คนตรวจ
  minAbsJump: 300, // เปลี่ยนจากครั้งก่อนอย่างน้อยเท่านี้ ... (ลบ.ม./วิ)
  maxRelJump: 0.5, // ... และเกินสัดส่วนนี้ → needs_review
  maxAgeDays: 7, // ประกาศเก่ากว่านี้ → needs_review
  maxTextChars: 30000,
};

/** โครงสร้างที่ยอมรับจาก AI (ตรวจด้วย zod) */
export const LlmSchema = z.object({
  discharge_cms: z.number().finite().nullable(),
  announced_at: z.string().nullable(),
  warning_text: z.string().max(800).nullable(),
  source_url: z.string().optional(),
});

export function htmlToText(html, max = LIMITS.maxTextChars) {
  return html
    .replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<\/(p|div|li|tr|h[1-6]|br)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/[ \t\u00a0]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim()
    .slice(0, max);
}

/** robots.txt แบบง่าย: ดูกลุ่ม User-agent: * (หรือชื่อเรา) แล้วเช็ก Disallow/Allow ที่ยาวที่สุดที่ตรงกับ path */
export function robotsAllows(robotsTxt, path, ua = "namnontwatch") {
  const groups = [];
  let cur = null;
  for (const raw of robotsTxt.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, "").trim();
    const m = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const key = m[1].toLowerCase();
    if (key === "user-agent") {
      if (!cur || cur.rules.length) { cur = { agents: [], rules: [] }; groups.push(cur); }
      cur.agents.push(m[2].toLowerCase());
    } else if (cur && (key === "disallow" || key === "allow")) {
      cur.rules.push({ allow: key === "allow", path: m[2] });
    }
  }
  const mine = groups.filter((g) => g.agents.some((a) => a !== "*" && ua.includes(a)));
  const use = mine.length ? mine : groups.filter((g) => g.agents.includes("*"));
  let best = null;
  for (const g of use) for (const r of g.rules) {
    if (r.path === "") continue; // Disallow: ว่าง = อนุญาตทั้งหมด
    if (path.startsWith(r.path) && (!best || r.path.length > best.path.length)) best = r;
  }
  return best ? best.allow : true;
}

export function buildPrompt(text, sourceUrl) {
  return [
    "สรุปเฉพาะสิ่งที่ปรากฏในข้อความนี้ ห้ามเดา ห้ามใช้ความรู้ภายนอก",
    "คืนเป็น JSON เท่านั้น (ไม่มีคำอธิบายอื่น) ตามคีย์:",
    '{ "discharge_cms": ตัวเลขการระบายน้ำเขื่อนเจ้าพระยา หน่วย ลูกบาศก์เมตร/วินาที (null ถ้าไม่พบในข้อความ),',
    '  "announced_at": วัน-เวลาที่ประกาศ รูปแบบ ISO 8601 ปี ค.ศ. เช่น "2026-09-30T09:00:00+07:00" (null ถ้าไม่พบ),',
    '  "warning_text": ข้อความเตือนพื้นที่ริมแม่น้ำเจ้าพระยา/นนทบุรี ที่ปรากฏในข้อความ สรุปไม่เกิน 3 ประโยค (null ถ้าไม่มี),',
    `  "source_url": "${sourceUrl}" }`,
    "ถ้าตัวเลขเป็นของเขื่อน/สถานีอื่น ไม่ใช่เขื่อนเจ้าพระยา ให้ใส่ null",
    "",
    "=== ข้อความต้นฉบับ ===",
    text,
  ].join("\n");
}

export function parseLlmJson(raw) {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  return LlmSchema.parse(JSON.parse(cleaned));
}

const THAI_DIGITS = "๐๑๒๓๔๕๖๗๘๙";
/** แปลงเลขไทย → อารบิก แล้วตัดคอมมา/ช่องว่าง เพื่อค้นตัวเลข */
export function normalizeDigits(s) {
  return s.replace(/[๐-๙]/g, (d) => String(THAI_DIGITS.indexOf(d))).replace(/[,\s]/g, "");
}

/** ตัวเลขที่ AI ตอบ ต้อง "ปรากฏจริง" ในข้อความต้นฉบับ (กัน AI แต่งตัวเลข) */
export function numberAppearsInText(n, text) {
  const hay = normalizeDigits(text);
  const needle = String(n).replace(/\./g, "\\.");
  return new RegExp(`(?<![\\d.])${needle}(?![\\d])`).test(hay);
}

/** แก้ปี พ.ศ. → ค.ศ. ถ้า AI ตอบมาเป็น พ.ศ. แล้วคืน ISO หรือ null */
export function normalizeDate(s) {
  if (!s) return null;
  const m = s.match(/^(\d{4})(.*)$/);
  const fixed = m && Number(m[1]) > 2400 ? `${Number(m[1]) - 543}${m[2]}` : s;
  const t = Date.parse(fixed);
  return Number.isNaN(t) ? null : new Date(t).toISOString();
}

/** คืนรายการเหตุผลที่ต้องให้คนตรวจ (ว่าง = ผ่าน) */
export function assess({ parsed, text, previousOk, now = Date.now() }) {
  const reasons = [];
  const d = parsed.discharge_cms;
  if (d !== null) {
    if (!numberAppearsInText(d, text)) reasons.push(`ตัวเลข ${d} ไม่ปรากฏในข้อความต้นฉบับ (AI อาจแต่งขึ้น)`);
    if (d < LIMITS.minCms || d > LIMITS.maxCms) reasons.push(`ตัวเลข ${d} อยู่นอกช่วง ${LIMITS.minCms}–${LIMITS.maxCms} ลบ.ม./วินาที`);
    const prev = previousOk?.discharge_cms;
    if (typeof prev === "number") {
      const diff = Math.abs(d - prev);
      if (diff >= LIMITS.minAbsJump && diff / Math.max(prev, 1) > LIMITS.maxRelJump) reasons.push(`เปลี่ยนจากครั้งก่อนมากผิดปกติ (${prev} → ${d})`);
    }
    if (!parsed.announced_at) reasons.push("มีตัวเลขแต่ไม่พบวัน-เวลาประกาศ");
  }
  if (parsed.announced_at) {
    const iso = normalizeDate(parsed.announced_at);
    if (!iso) reasons.push("อ่านวัน-เวลาประกาศไม่ได้");
    else {
      const t = Date.parse(iso);
      if (t > now + 3_600_000) reasons.push("วัน-เวลาประกาศอยู่ในอนาคต");
      if (now - t > LIMITS.maxAgeDays * 86_400_000) reasons.push(`ประกาศเก่ากว่า ${LIMITS.maxAgeDays} วัน`);
    }
  }
  return reasons;
}

export const sameContent = (a, b) =>
  !!a && !!b && a.discharge_cms === b.discharge_cms && a.announced_at === b.announced_at && a.warning_text === b.warning_text;
