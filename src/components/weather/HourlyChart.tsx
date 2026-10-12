"use client";

import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

// กราฟพยากรณ์ฝนรายชั่วโมง 48 ชม.: แท่ง = ปริมาณฝน (มม.), เส้น = โอกาสฝน (%)
export interface ChartPoint {
  hour: string; // "14:00"
  day: string; // "พฤ."
  mm: number;
  prob: number | null;
}

export function HourlyChart({ data }: { data: ChartPoint[] }) {
  return (
    <div className="h-64 w-full" role="img" aria-label="กราฟปริมาณฝนและโอกาสฝนรายชั่วโมง 48 ชั่วโมงข้างหน้า">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -18 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
          <XAxis dataKey="hour" interval={5} tick={{ fill: "var(--ink-muted)", fontSize: 12 }} />
          <YAxis yAxisId="mm" tick={{ fill: "var(--ink-muted)", fontSize: 12 }} unit=" มม." width={56} />
          <YAxis yAxisId="p" orientation="right" domain={[0, 100]} tick={{ fill: "var(--ink-muted)", fontSize: 12 }} unit="%" width={40} />
          <Tooltip
            contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)", color: "var(--ink)" }}
            labelFormatter={(_, p) => (p?.[0]?.payload ? `${p[0].payload.day} ${p[0].payload.hour} น.` : "")}
          />
          <Bar yAxisId="mm" dataKey="mm" name="ฝน (มม.)" fill="var(--brand)" isAnimationActive={false} />
          <Line yAxisId="p" dataKey="prob" name="โอกาสฝน (%)" stroke="var(--call)" strokeWidth={2} dot={false} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
