import type { Metadata } from "next";
import { Phone } from "lucide-react";
import { LocationShare } from "@/components/help/LocationShare";
import { SectionTitle } from "@/components/ui/SectionTitle";
import type { ContactsData } from "@/lib/content-types";
import contactsJson from "@data/contacts.json";

export const metadata: Metadata = { title: "ช่วยเหลือ" };

// เบอร์โทรและข้อความตัวอย่างอยู่ที่ data/contacts.json
const contacts = contactsJson as ContactsData;
const isDev = process.env.NODE_ENV !== "production";

export default function HelpPage() {
  const { national, local, callScript } = contacts;

  return (
    <div className="space-y-8">
      <SectionTitle as="h1" description="แตะเบอร์เพื่อโทรออกทันที (ใช้ได้บนมือถือ)">
        ขอความช่วยเหลือ
      </SectionTitle>

      <section aria-labelledby="national">
        <h2 id="national" className="mb-3 text-xl font-bold">
          เบอร์ฉุกเฉินทั่วประเทศ
        </h2>
        <ul className="grid gap-3">
          {national.map((c) => (
            <li key={c.id}>
              <a
                href={`tel:${c.number}`}
                className="flex min-h-16 items-center gap-4 rounded-card border-2 border-call bg-surface p-3"
              >
                <span className="flex h-12 min-w-24 items-center justify-center gap-2 rounded-control bg-call px-3 text-2xl font-bold tabular-nums text-call-ink">
                  <Phone className="h-5 w-5" aria-hidden />
                  {c.number}
                </span>
                <span className="text-base font-medium">
                  {c.description}
                  <span className="sr-only"> โทร {c.number}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="local">
        <h2 id="local" className="mb-1 text-xl font-bold">
          เบอร์ในพื้นที่
        </h2>
        <p className="mb-3 text-base text-ink-muted">เสาธงหิน · บางใหญ่ · นนทบุรี</p>
        <ul className="grid gap-3">
          {local.map((c) => (
            <li key={c.id} className="rounded-card border border-line bg-surface p-3">
              <p className="text-base font-semibold">{c.name}</p>
              {c.description && <p className="text-sm text-ink-muted">{c.description}</p>}
              {c.number ? (
                <a
                  href={`tel:${c.number.replace(/[^\d+]/g, "")}`}
                  className="mt-2 inline-flex min-h-12 items-center gap-2 rounded-control border-2 border-call bg-call px-4 text-lg font-bold tabular-nums text-call-ink"
                >
                  <Phone className="h-5 w-5" aria-hidden />
                  {c.number}
                </a>
              ) : (
                <>
                  <p className="mt-1 text-lg font-semibold text-ink-muted">ยังไม่มีข้อมูล</p>
                  {/* โน้ต TODO แสดงเฉพาะตอนรันในเครื่อง (npm run dev) ผู้ใช้จริงจะไม่เห็น */}
                  {isDev && c.todo && <p className="mt-1 text-sm text-lv-watch-fg">{c.todo}</p>}
                </>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="loc">
        <h2 id="loc" className="mb-3 text-xl font-bold">
          ส่งตำแหน่งของคุณ
        </h2>
        <LocationShare />
      </section>

      <section aria-labelledby="script">
        <h2 id="script" className="mb-1 text-xl font-bold">
          เมื่อโทรขอความช่วยเหลือ ควรบอกอะไร
        </h2>
        <p className="mb-3 text-base text-ink-muted">{callScript.intro}</p>
        {/* ใช้ลำดับเลข เพราะเป็นขั้นตอนที่ควรบอกตามลำดับจริง */}
        <ol className="list-decimal space-y-3 rounded-card border border-line bg-surface py-4 pl-10 pr-4">
          {callScript.steps.map((s) => (
            <li key={s.id} className="pl-1">
              <p className="text-base font-semibold">{s.title}</p>
              <p className="text-base text-ink-muted">{s.detail}</p>
            </li>
          ))}
        </ol>

        <h3 className="mb-2 mt-5 text-lg font-bold">ตัวอย่างประโยค</h3>
        <blockquote className="rounded-card border-l-8 border-l-brand bg-brand-soft p-4 text-base">
          {callScript.example}
        </blockquote>

        <ul className="mt-4 list-disc space-y-1 pl-6 text-base">
          {callScript.tips.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
