"use client";

import dynamic from "next/dynamic";
import type { ChartPoint } from "./HourlyChart";

// Recharts ค่อนข้างหนัก → โหลดเมื่อหน้าแสดงผลแล้วเท่านั้น
const Chart = dynamic(() => import("./HourlyChart").then((m) => m.HourlyChart), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse rounded-control bg-surface-2" aria-label="กำลังโหลดกราฟ" />,
});

export function HourlyChartLazy({ data }: { data: ChartPoint[] }) {
  return <Chart data={data} />;
}
