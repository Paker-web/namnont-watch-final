"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

// เก็บสถานะการติ๊ก checklist ใน localStorage ของเบราว์เซอร์ (ไม่ส่งขึ้นเซิร์ฟเวอร์)
// - ทุกการอ่าน/เขียนห่อ try/catch เพราะบางเบราว์เซอร์ (เช่นโหมดส่วนตัว) ห้ามใช้ localStorage
// - ถ้าเขียนไม่ได้ จะเก็บไว้ในตัวแปร fallback (จำได้จนกว่าจะปิดหน้า)
// - ใช้ useSyncExternalStore เพื่อให้ไม่เกิด hydration mismatch (เซิร์ฟเวอร์เรนเดอร์แบบยังไม่ติ๊กก่อน)

const KEY = "namnont-watch:checklist:v1";
const CHANGE_EVENT = "namnont-watch:checklist-change";

let fallback: string | null = null;

function readRaw(): string | null {
  if (fallback !== null) return fallback;
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange); // เปลี่ยนจากแท็บอื่น
  window.addEventListener(CHANGE_EVENT, onChange); // เปลี่ยนในแท็บนี้
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function writeRaw(json: string) {
  try {
    window.localStorage.setItem(KEY, json);
    fallback = null;
  } catch {
    fallback = json;
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useChecklist() {
  const raw = useSyncExternalStore(subscribe, readRaw, () => null);

  const checked = useMemo<Record<string, boolean>>(() => {
    if (!raw) return {};
    try {
      const parsed: unknown = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? (parsed as Record<string, boolean>) : {};
    } catch {
      return {};
    }
  }, [raw]);

  const toggle = useCallback(
    (id: string) => {
      const next = { ...checked };
      if (next[id]) delete next[id];
      else next[id] = true;
      writeRaw(JSON.stringify(next));
    },
    [checked],
  );

  const clearAll = useCallback(() => writeRaw("{}"), []);

  return { checked, toggle, clearAll };
}
