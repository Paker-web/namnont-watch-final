"use client";

import { useState } from "react";
import { Copy, MapPin } from "lucide-react";

// ปุ่ม "คัดลอกตำแหน่งของฉัน": ขอพิกัดจากเบราว์เซอร์ → สร้างลิงก์ Google Maps → คัดลอก
// พิกัดอยู่ในเครื่องผู้ใช้เท่านั้น ไม่ถูกส่งไปที่เซิร์ฟเวอร์ของเรา
type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; url: string; accuracy: number; copied: boolean }
  | { status: "error"; message: string };

function errorMessage(err: GeolocationPositionError): string {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return "ไม่ได้อนุญาตให้เข้าถึงตำแหน่ง — เปิดสิทธิ์ตำแหน่งให้เว็บนี้ในการตั้งค่าเบราว์เซอร์ แล้วลองใหม่";
    case err.POSITION_UNAVAILABLE:
      return "หาตำแหน่งไม่ได้ ลองเปิด GPS หรือออกไปที่โล่ง แล้วลองใหม่";
    default:
      return "หมดเวลาระหว่างหาตำแหน่ง ลองใหม่อีกครั้ง";
  }
}

async function tryCopy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false; // เบราว์เซอร์ไม่อนุญาต — ผู้ใช้ยังกดคัดลอกเองจากช่องข้อความได้
  }
}

export function LocationShare() {
  const [state, setState] = useState<State>({ status: "idle" });

  function locate() {
    if (!("geolocation" in navigator)) {
      setState({ status: "error", message: "เบราว์เซอร์นี้ไม่รองรับการหาตำแหน่ง" });
      return;
    }
    setState({ status: "loading" });
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const url = `https://www.google.com/maps?q=${latitude.toFixed(6)},${longitude.toFixed(6)}`;
        const copied = await tryCopy(url);
        setState({ status: "done", url, accuracy, copied });
      },
      (err) => setState({ status: "error", message: errorMessage(err) }),
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
    );
  }

  return (
    <div className="rounded-card border border-line bg-surface p-4">
      <button
        type="button"
        onClick={locate}
        disabled={state.status === "loading"}
        className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-control border-2 border-brand bg-brand px-4 text-lg font-bold text-brand-ink disabled:opacity-70"
      >
        <MapPin className="h-6 w-6" aria-hidden />
        {state.status === "loading" ? "กำลังหาตำแหน่ง…" : "คัดลอกตำแหน่งของฉัน"}
      </button>
      <p className="mt-2 text-sm text-ink-muted">
        สร้างลิงก์ Google Maps จากตำแหน่งปัจจุบัน เพื่อวางส่งให้เจ้าหน้าที่หรือญาติ ตำแหน่งไม่ถูกส่งไปที่เซิร์ฟเวอร์ของเว็บนี้
      </p>

      {/* aria-live ให้ตัวช่วยอ่านหน้าจออ่านผลให้ทันทีที่เปลี่ยน */}
      <div aria-live="polite" className="mt-3">
        {state.status === "error" && (
          <p className="rounded-control border-2 border-lv-critical-line bg-lv-critical-bg p-3 text-base text-lv-critical-fg">
            {state.message}
          </p>
        )}
        {state.status === "done" && (
          <div className="space-y-2">
            <p className="font-semibold text-lv-ok-fg">
              {state.copied ? "คัดลอกลิงก์แล้ว" : "หาตำแหน่งได้แล้ว — คัดลอกอัตโนมัติไม่ได้ กรุณากดคัดลอกเองจากช่องด้านล่าง"}
            </p>
            <input
              readOnly
              value={state.url}
              onFocus={(e) => e.currentTarget.select()}
              aria-label="ลิงก์ตำแหน่งของคุณ"
              className="w-full rounded-control border-2 border-line bg-bg px-3 py-2 text-base"
            />
            <p className="text-sm text-ink-muted">ความแม่นยำประมาณ {Math.round(state.accuracy)} เมตร</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={async () => {
                  const ok = await tryCopy(state.url);
                  setState({ ...state, copied: ok });
                }}
                className="inline-flex min-h-12 items-center gap-2 rounded-control border-2 border-brand bg-surface px-4 text-base font-semibold text-brand"
              >
                <Copy className="h-5 w-5" aria-hidden />
                คัดลอกอีกครั้ง
              </button>
              <a
                href={state.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center rounded-control border-2 border-line bg-surface px-4 text-base font-semibold"
              >
                เปิดดูในแผนที่
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
