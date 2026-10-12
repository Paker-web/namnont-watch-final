"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LocateFixed } from "lucide-react";

// เลือกพื้นที่พยากรณ์: dropdown (พิกัดโดยประมาณระดับอำเภอ) หรือ "ใช้ตำแหน่งฉัน"
// ตำแหน่งผู้ใช้ถูกปัดเหลือ 2 ทศนิยม (~1 กม.) ก่อนส่งให้เซิร์ฟเวอร์ เพื่อความเป็นส่วนตัวและให้แคชใช้ซ้ำได้
export function AreaPicker({ areas, selected }: { areas: { slug: string; name: string; province: string }[]; selected: string | "me" }) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function useMyLocation() {
    if (!("geolocation" in navigator)) return setMsg("เบราว์เซอร์นี้ไม่รองรับการหาตำแหน่ง");
    setBusy(true);
    setMsg(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBusy(false);
        const { latitude, longitude } = pos.coords;
        router.push(`/weather?lat=${latitude.toFixed(2)}&lng=${longitude.toFixed(2)}`);
      },
      () => {
        setBusy(false);
        setMsg("หาตำแหน่งไม่ได้ (อาจยังไม่ได้อนุญาตตำแหน่ง) เลือกพื้นที่จากรายการแทนได้");
      },
      { timeout: 15_000, maximumAge: 300_000 },
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-base font-semibold" htmlFor="area">พื้นที่พยากรณ์</label>
      <div className="flex flex-wrap gap-2">
        <select
          id="area"
          value={selected}
          onChange={(e) => e.target.value !== "me" && router.push(`/weather?area=${e.target.value}`)}
          className="min-h-12 min-w-0 flex-1 rounded-control border-2 border-line bg-surface px-3 text-base"
        >
          {selected === "me" && <option value="me">ตำแหน่งของคุณ (โดยประมาณ)</option>}
          {areas.map((a) => (
            <option key={a.slug} value={a.slug}>{a.name} — {a.province}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={useMyLocation}
          disabled={busy}
          className="inline-flex min-h-12 items-center gap-2 rounded-control border-2 border-brand bg-surface px-4 text-base font-semibold text-brand disabled:opacity-60"
        >
          <LocateFixed className="h-5 w-5" aria-hidden />
          {busy ? "กำลังหา…" : "ใช้ตำแหน่งฉัน"}
        </button>
      </div>
      {msg && <p className="text-base text-lv-watch-fg" role="status">{msg}</p>}
    </div>
  );
}
