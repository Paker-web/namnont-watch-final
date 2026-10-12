"use client";

import dynamic from "next/dynamic";

// โหลดแผนที่แบบ lazy (ไม่โหลด Leaflet ตอนเปิดหน้าแรก) และไม่เรนเดอร์ฝั่งเซิร์ฟเวอร์
const RadarMap = dynamic(() => import("./RadarMap").then((m) => m.RadarMap), {
  ssr: false,
  loading: () => <div className="h-[52vh] min-h-80 animate-pulse rounded-card border border-line bg-surface-2" aria-label="กำลังโหลดแผนที่" />,
});

export function RadarMapLazy(props: { home: { lat: number; lng: number; name: string; verified: boolean } }) {
  return <RadarMap {...props} />;
}
