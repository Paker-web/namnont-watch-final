import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { SectionTitle } from "@/components/ui/SectionTitle";
import type { SourcesData } from "@/lib/content-types";
import sourcesJson from "@data/sources.json";

export const metadata: Metadata = { title: "เกี่ยวกับ / แหล่งข้อมูล" };

const { sources } = sourcesJson as SourcesData;

export default function AboutPage() {
  return (
    <div className="space-y-8">
      <SectionTitle as="h1" description="เว็บนี้ทำอะไร ใช้ข้อมูลจากไหน และข้อจำกัดที่ควรรู้">
        เกี่ยวกับเว็บนี้
      </SectionTitle>

      <section>
        <h2 className="mb-2 text-xl font-bold">เว็บนี้คืออะไร</h2>
        <p className="text-base">
          น้ำนนท์ Watch (ชื่อชั่วคราว) รวบรวมข้อมูลสถานการณ์น้ำลุ่มน้ำเจ้าพระยา เน้นนนทบุรี
          โดยเฉพาะพื้นที่ใกล้ ต.เสาธงหิน อ.บางใหญ่ เพื่อให้ดูจากมือถือแล้วรู้ว่าตอนนี้ควรทำอะไร
          เว็บนี้เป็นโครงการอิสระ ไม่ใช่เว็บของหน่วยงานรัฐ
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-bold">ข้อจำกัดของข้อมูล</h2>
        <ul className="list-disc space-y-2 pl-6 text-base">
          <li>ไม่ใช่ประกาศเตือนภัยอย่างเป็นทางการ โปรดตรวจสอบกับ ปภ. โทร 1784</li>
          <li>ข้อมูลจากแหล่งภายนอกอาจล่าช้า คลาดเคลื่อน หรือไม่พร้อมใช้งานเป็นบางช่วง</li>
          <li>
            เว็บพักข้อมูลไว้ชั่วคราวเพื่อไม่ให้ไปรบกวนแหล่งข้อมูล (ประมาณ 5–10 นาที) ทุกการ์ดจึงมีเวลาอัปเดตกำกับ
          </li>
          <li>
            ป้ายสถานะบนการ์ด: <strong>สด</strong> = ดึงข้อมูลได้ปกติ, <strong>ค้าง</strong> = ดึงข้อมูลใหม่ไม่ได้
            จึงแสดงค่าล่าสุดที่บันทึกไว้, <strong>ไม่พร้อมใช้งาน</strong> = ไม่มีข้อมูลให้แสดง
          </li>
          <li>ถ้าไม่มีข้อมูลจริง เว็บจะแสดง “ยังไม่มีข้อมูล” และไม่เดาตัวเลขเอง</li>
          <li>เนื้อหาหน้า “เตรียมตัว” ร่างจากแนวทางทั่วไปและยังรอการตรวจสอบกับ ปภ.</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-bold">แหล่งข้อมูล</h2>
        <ul className="grid gap-3">
          {sources.map((s) => (
            <li key={s.id} className="rounded-card border border-line bg-surface p-3">
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-base font-semibold text-brand underline underline-offset-2"
              >
                {s.name}
                <ExternalLink className="h-4 w-4" aria-hidden />
                <span className="sr-only">(เปิดในแท็บใหม่)</span>
              </a>
              <p className="mt-1 text-base text-ink-muted">{s.usedFor}</p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-bold">ความเป็นส่วนตัว</h2>
        <p className="text-base">
          รายการที่ติ๊กในหน้าเตรียมตัวถูกเก็บในเบราว์เซอร์ของคุณเท่านั้น
          และตำแหน่งที่ใช้คัดลอกลิงก์ก็ไม่ถูกส่งไปที่เซิร์ฟเวอร์ของเว็บนี้
        </p>
      </section>
    </div>
  );
}
