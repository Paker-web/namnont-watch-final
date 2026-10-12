import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { MapClientLazy } from "@/components/map/MapClientLazy";
import { Notice } from "@/components/ui/Notice";
import { SectionTitle } from "@/components/ui/SectionTitle";
import type { LinksData } from "@/lib/content-types";
import { places } from "@/lib/places";
import { stationsConfig } from "@/lib/services";
import linksJson from "@data/links.json";

export const metadata: Metadata = { title: "แผนที่จุดอพยพและที่จอดรถ" };

const report = (linksJson as LinksData).links.find((l) => l.id === "report-place");

export default function MapPage() {
  const sampleCount = places.filter((p) => p.sample).length;
  return (
    <div className="space-y-4 pb-20 sm:pb-0">
      <SectionTitle as="h1" description="จุดอพยพ ศูนย์พักพิง และที่จอดรถ เริ่มที่รัศมี 5 กม. รอบเสาธงหิน">
        แผนที่จุดอพยพ
      </SectionTitle>

      {sampleCount > 0 && (
        <Notice tone="warn">
          <strong>ข้อมูลในหน้านี้เป็นข้อมูลตัวอย่าง {sampleCount} จุด สำหรับทดสอบระบบ — ไม่ใช่สถานที่จริง</strong>{" "}
          ยังไม่มีจุดอพยพที่ผ่านการตรวจสอบ ให้สอบถามจุดอพยพจริงจากเทศบาล/อำเภอ หรือโทร 1784
        </Notice>
      )}

      <MapClientLazy home={stationsConfig.home} />

      <div className="rounded-card border border-line bg-surface p-4">
        <h2 className="text-lg font-bold">พบจุดใหม่ หรือข้อมูลผิด?</h2>
        <p className="mt-1 text-base text-ink-muted">ช่วยแจ้งผ่านแบบฟอร์ม ผู้ดูแลจะตรวจสอบก่อนนำขึ้นแผนที่</p>
        {report?.url ? (
          <a href={report.url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-12 items-center gap-2 rounded-control border-2 border-brand bg-brand px-4 text-base font-bold text-brand-ink">
            แจ้งจุดใหม่/แก้ข้อมูล <ExternalLink className="h-4 w-4" aria-hidden /><span className="sr-only">(เปิดในแท็บใหม่)</span>
          </a>
        ) : (
          <p className="mt-3 text-base font-semibold text-ink-muted">ยังไม่มีลิงก์แบบฟอร์ม (เจ้าของเว็บจะเพิ่มภายหลัง)</p>
        )}
      </div>
      <p className="text-sm text-ink-muted">
        แผนที่: <a className="text-brand underline underline-offset-2" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors</a>
      </p>
    </div>
  );
}
