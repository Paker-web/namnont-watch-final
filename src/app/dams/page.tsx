import type { Metadata } from "next";
import { Suspense } from "react";
import { DamCard } from "@/components/dams/DamCard";
import { DamDischargeCard } from "@/components/dams/DamDischargeCard";
import { DataCard } from "@/components/ui/DataCard";
import { Notice } from "@/components/ui/Notice";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { LinksBox } from "@/components/water/LinksBox";
import { damsConfig, getDamsSnapshot, nowMs } from "@/lib/services";

export const metadata: Metadata = { title: "เขื่อนและประกาศ" };
export const dynamic = "force-dynamic";

export default function DamsPage() {
  return (
    <div className="space-y-6">
      <SectionTitle as="h1" description="เขื่อนที่เกี่ยวกับลุ่มน้ำเจ้าพระยา และประกาศการระบายน้ำ">เขื่อนและประกาศ</SectionTitle>

      <section>
        <SectionTitle>การระบายน้ำเขื่อนเจ้าพระยา</SectionTitle>
        <DamDischargeCard />
        <p className="mt-2 text-sm text-ink-muted">
          ตัวเลขนี้ AI สรุปจากข้อความประกาศ ไม่ใช่ข้อมูลที่ดึงตรงจากระบบวัด — ตรวจสอบกับต้นฉบับทุกครั้งก่อนตัดสินใจ
        </p>
      </section>

      <section>
        <SectionTitle description="ปริมาณน้ำในอ่างเก็บน้ำ (ข้อมูลรายวัน)">เขื่อนใหญ่</SectionTitle>
        <Suspense fallback={<DataCard title="กำลังโหลดข้อมูลเขื่อน…" freshness="unavailable" />}>
          <Dams />
        </Suspense>
      </section>

      <LinksBox ids={["tw-national-diagram", "tw-national-cctv", "rid-dam-report", "tide"]} title="แผนผังน้ำและรายงานต้นฉบับ" />
    </div>
  );
}

async function Dams() {
  const snap = await getDamsSnapshot();
  if (!snap.data) {
    return (
      <Notice tone="error">
        <strong>ข้อมูลเขื่อนไม่พร้อมใช้งานชั่วคราว</strong> — {snap.error ?? "ดึงข้อมูลไม่สำเร็จ"} ดูรายงานต้นฉบับของกรมชลประทานด้านล่าง
      </Notice>
    );
  }
  const { date, dams } = snap.data;
  const ageDays = date ? (nowMs() - Date.parse(`${date}T00:00:00+07:00`)) / 86_400_000 : Infinity;
  const freshness = snap.stale || ageDays > 2 ? "stale" : "live"; // รายงานรายวัน เก่ากว่า 2 วัน = ค้าง
  const shown = damsConfig.dams.filter((d) => d.confirmed);

  return (
    <div className="space-y-3">
      {snap.stale && <Notice tone="warn"><strong>ข้อมูลค้าง</strong> — ดึงข้อมูลใหม่ไม่สำเร็จ ({snap.error}) แสดงค่าที่บันทึกไว้</Notice>}
      {shown.map((cfg) => (
        <DamCard
          key={cfg.id}
          label={cfg.label}
          dam={dams.find((d) => cfg.match.some((m) => d.name.includes(m))) ?? null}
          date={date}
          freshness={freshness}
          flowUnit={damsConfig.flowUnit}
        />
      ))}
    </div>
  );
}
