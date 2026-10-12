import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { DataCard } from "@/components/ui/DataCard";
import { Notice } from "@/components/ui/Notice";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { LinksBox } from "@/components/water/LinksBox";
import { RainCard } from "@/components/water/RainCard";
import { StationCard, type StationView } from "@/components/water/StationCard";
import { StationTable } from "@/components/water/StationTable";
import { PROVINCES, resolveProvince } from "@/lib/provinces";
import { getWaterSnapshot, nowMs, stationsConfig } from "@/lib/services";
import { byRisk, observationStale, waterLevelOf } from "@/lib/status-rules";

export const metadata: Metadata = { title: "ระดับน้ำ" };
// ดึงข้อมูลสดทุกครั้ง (ผ่านแคช 300 วินาทีในเซิร์ฟเวอร์ — ดู src/lib/cache.ts)
export const dynamic = "force-dynamic";

export default async function WaterPage({ searchParams }: { searchParams: Promise<{ province?: string }> }) {
  const { province: q } = await searchParams;
  const province = resolveProvince(q) ?? PROVINCES[0];

  return (
    <div className="space-y-6">
      <SectionTitle as="h1" description="ข้อมูลสถานีวัดน้ำจาก ThaiWater เรียงตามความเสี่ยง">
        ระดับน้ำ
      </SectionTitle>

      {/* แท็บจังหวัด: เป็นลิงก์ธรรมดา (ใช้ได้แม้ปิด JavaScript) */}
      <nav aria-label="เลือกจังหวัด" className="grid grid-cols-3 gap-1 rounded-control bg-surface-2 p-1">
        {PROVINCES.map((p) => {
          const active = p.code === province.code;
          return (
            <Link
              key={p.code}
              href={`/water?province=${p.slug}`}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-14 items-center justify-center rounded-[0.6rem] border-2 px-1 text-center text-sm leading-tight ${
                active ? "border-brand bg-surface font-bold text-brand" : "border-transparent font-medium text-ink-muted"
              }`}
            >
              {p.th}
            </Link>
          );
        })}
      </nav>

      <Suspense key={province.code} fallback={<DataCard title="กำลังโหลดข้อมูลสถานี…" freshness="unavailable" />}>
        <WaterContent provinceCode={province.code} provinceName={province.th} />
      </Suspense>

      {province.code === PROVINCES[0].code && (
        <section>
          <SectionTitle>ฝนสะสม</SectionTitle>
          <Suspense fallback={<DataCard title="ฝนสะสม 24 ชม." freshness="unavailable" />}>
            <RainCard />
          </Suspense>
        </section>
      )}

      <LinksBox />
      <p className="text-sm text-ink-muted">
        % ตลิ่ง = ระดับน้ำเทียบความลึกถึงตลิ่ง (100% = เสมอตลิ่ง) · ม.รทก. = เมตรเหนือระดับน้ำทะเลปานกลาง ·
        แหล่งข้อมูลนี้ให้เฉพาะค่าปัจจุบันกับค่าครั้งก่อน จึงยังไม่มีกราฟย้อนหลัง 24 ชม.
      </p>
    </div>
  );
}

async function WaterContent({ provinceCode, provinceName }: { provinceCode: string; provinceName: string }) {
  const snap = await getWaterSnapshot();
  const now = nowMs();
  const stations: StationView[] = (snap.data ?? [])
    .filter((s) => s.provinceCode === provinceCode)
    .sort(byRisk)
    .map((s) => ({ ...s, level: waterLevelOf(s), observationStale: observationStale(s.observedAt, "water", now) }));

  if (snap.data === null) {
    return (
      <Notice tone="error">
        <strong>ข้อมูลระดับน้ำไม่พร้อมใช้งานชั่วคราว</strong> — {snap.error ?? "ดึงข้อมูลไม่สำเร็จ"}
        {snap.retryAt && " ระบบจะลองใหม่โดยอัตโนมัติ"} ดูลิงก์ข้อมูลจริงด้านล่าง หรือตรวจสอบกับ ปภ. โทร 1784
      </Notice>
    );
  }

  const primary = stationsConfig.primaryWater.length
    ? stations.filter((s) => stationsConfig.primaryWater.includes(s.id))
    : [];
  // ยังไม่ได้เลือกสถานีหลัก → ใช้ 3 สถานีเสี่ยงสูงสุดของจังหวัดแทนชั่วคราว
  const featured = primary.length ? primary : stations.slice(0, 3);

  return (
    <>
      {snap.stale && (
        <Notice tone="warn">
          <strong>ข้อมูลค้าง</strong> — ดึงข้อมูลใหม่ไม่สำเร็จ ({snap.error}) กำลังแสดงค่าที่บันทึกไว้เมื่อ{" "}
          {snap.fetchedAt ? new Date(snap.fetchedAt).toLocaleTimeString("th-TH", { timeZone: "Asia/Bangkok", hour: "2-digit", minute: "2-digit" }) : "ก่อนหน้านี้"} น.
        </Notice>
      )}

      {stations.length === 0 ? (
        <Notice tone="info">ไม่พบสถานีวัดน้ำของ{provinceName}ในข้อมูลชุดนี้</Notice>
      ) : (
        <>
          <section>
            <SectionTitle description={primary.length ? undefined : "ยังไม่ได้เลือกสถานีหลัก — แสดง 3 สถานีที่ระดับน้ำสูงที่สุดของจังหวัดชั่วคราว"}>
              {primary.length ? "สถานีหลัก" : "สถานีเสี่ยงสูงสุด"}
            </SectionTitle>
            <div className="space-y-3">
              {featured.map((s) => (
                <StationCard key={s.id} st={s} snapshotStale={snap.stale} />
              ))}
            </div>
          </section>

          <section>
            <SectionTitle description={`${stations.length} สถานี เรียงตามความเสี่ยง`}>ทุกสถานีใน{provinceName}</SectionTitle>
            <StationTable stations={stations} snapshotStale={snap.stale} />
          </section>
        </>
      )}
    </>
  );
}
