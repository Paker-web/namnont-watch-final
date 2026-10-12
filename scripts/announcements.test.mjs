// รัน: npm run test:scripts   (ไม่ต้องใช้เน็ตหรือ GEMINI_API_KEY)
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { assess, htmlToText, normalizeDate, numberAppearsInText, parseLlmJson, robotsAllows } from "./lib/announcements-core.mjs";

test("htmlToText ตัด script/tag", () => {
  const t = htmlToText("<html><script>var x=1</script><p>ระบายน้ำ&nbsp;1,850</p><style>a{}</style></html>");
  assert.match(t, /ระบายน้ำ 1,850/);
  assert.doesNotMatch(t, /var x/);
});

test("robots.txt: Disallow / Allow ที่ยาวกว่าชนะ", () => {
  const r = "User-agent: *\nDisallow: /private\nAllow: /private/ok\n";
  assert.equal(robotsAllows(r, "/news"), true);
  assert.equal(robotsAllows(r, "/private/x"), false);
  assert.equal(robotsAllows(r, "/private/ok/1"), true);
  assert.equal(robotsAllows("User-agent: *\nDisallow:\n", "/any"), true);
});

test("parseLlmJson: รับ ```json และปฏิเสธชนิดผิด", () => {
  const ok = parseLlmJson('```json\n{"discharge_cms":1850,"announced_at":null,"warning_text":null}\n```');
  assert.equal(ok.discharge_cms, 1850);
  assert.throws(() => parseLlmJson('{"discharge_cms":"หนึ่งพัน","announced_at":null,"warning_text":null}'));
});

test("ตัวเลขต้องปรากฏในต้นฉบับ (รองรับเลขไทย/คอมมา, ไม่จับตัวเลขซ้อน)", () => {
  assert.equal(numberAppearsInText(1850, "ระบายน้ำ ๑,๘๕๐ ลบ.ม./วินาที"), true);
  assert.equal(numberAppearsInText(350, "ระบายน้ำ 1,350 ลบ.ม./วินาที"), false);
  assert.equal(numberAppearsInText(1850, "ระบายน้ำ 1,300"), false);
});

test("normalizeDate แก้ปี พ.ศ.", () => {
  assert.equal(normalizeDate("2569-09-30T09:00:00+07:00"), "2026-09-30T02:00:00.000Z");
  assert.equal(normalizeDate("ไม่ใช่วันที่"), null);
});

const NOW = Date.parse("2026-09-30T10:00:00+07:00");
const base = { discharge_cms: 1850, announced_at: "2026-09-30T09:00:00+07:00", warning_text: null };
test("assess: ผ่าน / ตัวเลขไม่อยู่ในต้นฉบับ / กระโดดผิดปกติ / ไม่มีเวลา / ประกาศเก่า", () => {
  assert.deepEqual(assess({ parsed: base, text: "ระบาย 1,850", previousOk: { discharge_cms: 1700 }, now: NOW }), []);
  assert.ok(assess({ parsed: base, text: "ระบาย 1,800", now: NOW }).some((r) => /ไม่ปรากฏ/.test(r)));
  assert.ok(assess({ parsed: base, text: "ระบาย 1,850", previousOk: { discharge_cms: 500 }, now: NOW }).some((r) => /ผิดปกติ/.test(r)));
  assert.ok(assess({ parsed: { ...base, announced_at: null }, text: "1850", now: NOW }).some((r) => /วัน-เวลา/.test(r)));
  assert.ok(assess({ parsed: { ...base, announced_at: "2026-09-01T09:00:00+07:00" }, text: "1850", now: NOW }).some((r) => /เก่ากว่า/.test(r)));
  assert.ok(assess({ parsed: { ...base, discharge_cms: 9000 }, text: "9000", now: NOW }).some((r) => /นอกช่วง/.test(r)));
});

test("ทั้งสคริปต์ (fixture): บันทึก → ไม่เปลี่ยน → ค่ากระโดดติด needs_review", () => {
  const dir = mkdtempSync(join(tmpdir(), "ann-"));
  const sources = join(dir, "sources.json"), out = join(dir, "out.json");
  writeFileSync(sources, JSON.stringify({ announcementSources: { items: [{ id: "rid", name: "กรมชลประทาน", url: "https://example.org/a", confirmed: true }] } }));
  const iso = new Date(Date.now() - 3600_000).toISOString();
  const run = (fix) => {
    writeFileSync(join(dir, "rid.html"), `<p>ระบายน้ำเขื่อนเจ้าพระยา ${fix.n.toLocaleString("en-US")} ลบ.ม./วินาที</p>`);
    writeFileSync(join(dir, "rid.llm.json"), JSON.stringify({ discharge_cms: fix.n, announced_at: iso, warning_text: "เฝ้าระวังริมเจ้าพระยา" }));
    return execFileSync("node", ["scripts/update-announcements.mjs", `--fixture-dir=${dir}`, `--sources=${sources}`, `--out=${out}`], { encoding: "utf8" });
  };
  run({ n: 1200 });
  let d = JSON.parse(readFileSync(out, "utf8"));
  assert.equal(d.entries.length, 1);
  assert.equal(d.entries[0].needs_review, false);
  assert.equal(d.entries[0].source_url, "https://example.org/a");
  assert.match(run({ n: 1200 }), /ไม่มีการเปลี่ยนแปลง/);
  assert.equal(JSON.parse(readFileSync(out, "utf8")).entries.length, 1);
  run({ n: 3500 });
  d = JSON.parse(readFileSync(out, "utf8"));
  assert.equal(d.entries.length, 2);
  assert.equal(d.entries[1].needs_review, true);
  assert.match(d.entries[1].review_reasons.join(" "), /ผิดปกติ/);
});
