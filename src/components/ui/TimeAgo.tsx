"use client";

import { useSyncExternalStore } from "react";
import { formatThaiDateTime, formatTimeAgo } from "@/lib/format";

// แสดงเวลาอัปเดต เช่น "5 นาทีที่แล้ว" (และเวลาไทยเต็มเมื่อกดค้าง/ตัวช่วยอ่านหน้าจอ)
// ตอนเรนเดอร์ฝั่งเซิร์ฟเวอร์จะแสดงเวลาไทยเต็มก่อน แล้วสลับเป็น "x นาทีที่แล้ว" ในเบราว์เซอร์
// เพื่อไม่ให้ข้อความไม่ตรงกันระหว่างเซิร์ฟเวอร์กับเบราว์เซอร์ (hydration mismatch)

const TICK_MS = 30_000;

function subscribe(onChange: () => void) {
  const id = setInterval(onChange, TICK_MS);
  return () => clearInterval(id);
}
const getSnapshot = () => Math.floor(Date.now() / TICK_MS);
const getServerSnapshot = () => null;

export function TimeAgo({ iso }: { iso: string }) {
  const tick = useSyncExternalStore<number | null>(subscribe, getSnapshot, getServerSnapshot);
  const full = formatThaiDateTime(iso);
  const text = tick === null ? full : formatTimeAgo(iso, tick * TICK_MS);

  return (
    <time dateTime={iso} title={full}>
      {text}
    </time>
  );
}
