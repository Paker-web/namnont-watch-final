import { SchemaError, UpstreamError } from "./errors";
import type { Snapshot } from "./types";

// =====================================================================
// แคชในหน่วยความจำ + backoff + คืนข้อมูลเก่า (stale)
//
// กติกา:
//  1) ข้อมูลอายุไม่เกิน ttl  → คืนเลย ไม่เรียก upstream
//  2) หมดอายุ → ดึงใหม่ (ถ้ามีคำขอซ้อนกัน จะรอการดึงครั้งเดียวกัน ไม่ยิงซ้ำ)
//  3) ดึงไม่สำเร็จ → บันทึกเวลา "พักการเรียก" (backoff) แล้วคืนข้อมูลเดิมพร้อม stale:true
//     - HTTP 429: พักตามลำดับ 1, 2, 5, 10, 30 นาที (ถ้า upstream ส่ง Retry-After มาจะเคารพ แต่ไม่เกิน 30 นาที)
//     - error อื่น: พัก 30 วินาที, 1, 2, 5 นาที
//  4) ไม่เคยได้ข้อมูลเลย → data:null (หน้าเว็บต้องแสดง "ไม่พร้อมใช้งาน" ห้ามพัง)
//
// ข้อจำกัด: แคชอยู่ในหน่วยความจำของ instance เดียว บน Vercel (serverless)
// แต่ละ instance มีแคชของตัวเอง จึงตั้ง Cache-Control ที่ route ให้ CDN ช่วยแคชอีกชั้น
// =====================================================================

const MIN = 60_000;
const BACKOFF_429 = [1 * MIN, 2 * MIN, 5 * MIN, 10 * MIN, 30 * MIN];
const BACKOFF_OTHER = [30_000, 1 * MIN, 2 * MIN, 5 * MIN];
const MAX_RETRY_AFTER = 30 * MIN;

interface Entry {
  data: unknown | null;
  fetchedAt: number | null;
  failures: number;
  backoffUntil: number;
  lastError?: string;
  inflight?: Promise<void>;
}

const store = new Map<string, Entry>();

function entryOf(key: string): Entry {
  let e = store.get(key);
  if (!e) {
    if (store.size >= 200) {
      for (const k of store.keys()) if (k.startsWith("forecast:")) { store.delete(k); break; }
    }
    e = { data: null, fetchedAt: null, failures: 0, backoffUntil: 0 };
    store.set(key, e);
  }
  return e;
}

/** ข้อความที่ผู้ใช้เห็นได้ (ไม่เปิดเผยรายละเอียดภายใน) */
function publicMessage(err: unknown): string {
  if (err instanceof UpstreamError && err.status === 429) return "แหล่งข้อมูลจำกัดจำนวนคำขอชั่วคราว (429)";
  if (err instanceof UpstreamError) return "แหล่งข้อมูลไม่ตอบสนอง";
  if (err instanceof SchemaError) return "รูปแบบข้อมูลจากแหล่งข้อมูลเปลี่ยนไป";
  return "ดึงข้อมูลไม่สำเร็จ";
}

async function refresh(key: string, loader: () => Promise<unknown>) {
  const e = entryOf(key);
  try {
    e.data = await loader();
    e.fetchedAt = Date.now();
    e.failures = 0;
    e.backoffUntil = 0;
    e.lastError = undefined;
  } catch (err) {
    e.failures += 1;
    const is429 = err instanceof UpstreamError && err.status === 429;
    const ladder = is429 ? BACKOFF_429 : BACKOFF_OTHER;
    let delay = ladder[Math.min(e.failures, ladder.length) - 1];
    if (err instanceof UpstreamError && err.retryAfterMs) {
      delay = Math.min(Math.max(err.retryAfterMs, delay), MAX_RETRY_AFTER);
    }
    e.backoffUntil = Date.now() + delay;
    e.lastError = publicMessage(err);
    // log ฝั่งเซิร์ฟเวอร์ให้ผู้พัฒนาเห็นสาเหตุจริง
    console.error(`[cache:${key}] ${err instanceof Error ? err.message : String(err)} — พักการเรียก ${Math.round(delay / 1000)} วินาที`);
  }
}

export async function cached<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<Snapshot<T>> {
  const e = entryOf(key);
  const now = Date.now();
  const fresh = e.fetchedAt !== null && now - e.fetchedAt < ttlMs;

  if (!fresh && now >= e.backoffUntil) {
    e.inflight ??= refresh(key, loader).finally(() => {
      e.inflight = undefined;
    });
    await e.inflight;
  } else if (!fresh && e.inflight) {
    await e.inflight;
  }

  // สถานะหลังพยายามดึง
  const nowAfter = Date.now();
  const stillFresh = e.fetchedAt !== null && nowAfter - e.fetchedAt < ttlMs;
  const inBackoff = nowAfter < e.backoffUntil;
  return {
    data: (e.data as T | null) ?? null,
    fetchedAt: e.fetchedAt ? new Date(e.fetchedAt).toISOString() : null,
    stale: e.data !== null && !stillFresh,
    error: e.lastError,
    retryAt: inBackoff ? new Date(e.backoffUntil).toISOString() : null,
  };
}

/** สำหรับทดสอบเท่านั้น */
export function _resetCacheForTests() {
  store.clear();
}
