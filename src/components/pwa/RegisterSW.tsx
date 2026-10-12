"use client";

import { useEffect } from "react";

// ลงทะเบียน service worker เฉพาะ production (ตอน npm run dev ไม่ใช้ เพื่อไม่ให้แคชกวนการพัฒนา)
export function RegisterSW() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* ลงทะเบียนไม่ได้ก็ไม่เป็นไร เว็บยังใช้งานได้ตามปกติ */
      });
    }
  }, []);
  return null;
}
