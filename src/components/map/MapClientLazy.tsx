"use client";

import dynamic from "next/dynamic";

// โหลดแผนที่ + marker cluster แบบ lazy เมื่อเปิดหน้า /map เท่านั้น
const MapClient = dynamic(() => import("./MapClient").then((m) => m.MapClient), {
  ssr: false,
  loading: () => <div className="h-[48vh] min-h-72 animate-pulse rounded-card border border-line bg-surface-2" aria-label="กำลังโหลดแผนที่" />,
});

export function MapClientLazy(props: { home: { lat: number; lng: number; name: string; verified: boolean } }) {
  return <MapClient {...props} />;
}
