import Link from "next/link";
import { Suspense } from "react";
import { ClipboardCheck, LifeBuoy, Map as MapIcon, Phone, Radar, Waves } from "lucide-react";
import { DamDischargeCard } from "@/components/dams/DamDischargeCard";
import { OverallStatus } from "@/components/status/OverallStatus";
import { DataCard } from "@/components/ui/DataCard";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { RainCard } from "@/components/water/RainCard";
import { RainOutlookCard } from "@/components/weather/RainOutlookCard";
import { LEVEL_ORDER } from "@/lib/situation";

// หน้าภาพรวม: น้ำ → เขื่อน → ฝน → ต้องทำอะไร/โทรหาใคร
// ทุกการ์ดดึงข้อมูลผ่านแคชฝั่งเซิร์ฟเวอร์ และล้มเหลวได้โดยไม่ทำให้หน้าพัง (แสดง ค้าง / ไม่พร้อมใช้งาน)
export const dynamic = "force-dynamic";

const loading = (title: string) => <DataCard title={title} valueSlot={<span className="text-xl font-semibold text-ink-muted">กำลังโหลด…</span>} freshness="unavailable" />;

const MORE = [
  { href: "/water", label: "ระดับน้ำทุกสถานี", Icon: Waves },
  { href: "/weather", label: "เรดาร์และพยากรณ์", Icon: Radar },
  { href: "/map", label: "แผนที่จุดอพยพ", Icon: MapIcon },
  { href: "/dams", label: "เขื่อนและประกาศ", Icon: Waves },
] as const;

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section>
        <SectionTitle as="h1" description="ระดับน้ำ เขื่อน ฝน และสิ่งที่ควรทำ ในที่เดียว">ภาพรวมสถานการณ์</SectionTitle>
        <div className="space-y-3">
          <Suspense fallback={loading("สถานะรวม จ.นนทบุรี")}><OverallStatus /></Suspense>
          <DamDischargeCard />
          <Suspense fallback={loading("ฝนสะสม 24 ชม.")}><RainCard /></Suspense>
          <Suspense fallback={loading("ฝน 6 ชั่วโมงข้างหน้า")}><RainOutlookCard /></Suspense>
        </div>
      </section>

      <section>
        <SectionTitle>ทำอะไรได้ตอนนี้</SectionTitle>
        <div className="grid gap-3">
          <a href="tel:1784" className="flex min-h-16 items-center gap-3 rounded-card border-2 border-call bg-call p-4 text-call-ink">
            <Phone className="h-8 w-8 shrink-0" aria-hidden />
            <span><span className="block text-lg font-bold">โทร 1784 (ปภ.)</span><span className="block text-base">แจ้งภัยพิบัติ / ขอความช่วยเหลือ</span></span>
          </a>
          <Link href="/help" className="flex min-h-16 items-center gap-3 rounded-card border border-line bg-surface p-4">
            <LifeBuoy className="h-8 w-8 shrink-0 text-brand" aria-hidden />
            <span><span className="block text-lg font-semibold">ขอความช่วยเหลือ</span><span className="block text-base text-ink-muted">เบอร์ฉุกเฉิน และส่งตำแหน่งของคุณ</span></span>
          </Link>
          <Link href="/prepare" className="flex min-h-16 items-center gap-3 rounded-card border border-line bg-surface p-4">
            <ClipboardCheck className="h-8 w-8 shrink-0 text-brand" aria-hidden />
            <span><span className="block text-lg font-semibold">เตรียมตัวรับน้ำท่วม</span><span className="block text-base text-ink-muted">เช็กลิสต์ก่อน ระหว่าง และหลังน้ำท่วม</span></span>
          </Link>
        </div>
      </section>

      <section>
        <SectionTitle>ดูเพิ่มเติม</SectionTitle>
        <ul className="grid grid-cols-2 gap-3">
          {MORE.map(({ href, label, Icon }) => (
            <li key={href}>
              <Link href={href} className="flex min-h-16 items-center gap-2 rounded-card border border-line bg-surface p-3 text-base font-semibold">
                <Icon className="h-6 w-6 shrink-0 text-brand" aria-hidden />{label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <SectionTitle description="ทุกระดับมีไอคอนและข้อความกำกับ ไม่ได้ใช้สีอย่างเดียว">ระดับสถานการณ์</SectionTitle>
        <ul className="flex flex-wrap gap-2">
          {LEVEL_ORDER.map((lv) => (<li key={lv}><StatusBadge kind="level" value={lv} size="lg" /></li>))}
        </ul>
      </section>
    </div>
  );
}
