import Link from "next/link";
import type { SourcesData } from "@/lib/content-types";
import sourcesJson from "@data/sources.json";
import { Disclaimer } from "./Disclaimer";
import { ShareButtons } from "./ShareButtons";

const { sources } = sourcesJson as SourcesData;

// ท้ายทุกหน้า: disclaimer + รายชื่อแหล่งข้อมูล (แก้รายชื่อได้ที่ data/sources.json)
// pb-28 เว้นที่ไว้ไม่ให้เมนูล่างทับเนื้อหา
export function Footer() {
  return (
    <footer className="border-t border-line bg-bg px-4 pb-28 pt-6 print:pb-4">
      <div className="mx-auto max-w-2xl space-y-4">
        <ShareButtons />
        <Disclaimer />
        <div>
          <p className="text-base font-semibold">แหล่งข้อมูล</p>
          <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-base">
            {sources.map((s) => (
              <li key={s.id}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block py-1 text-brand underline underline-offset-2"
                >
                  {s.name}
                  <span className="sr-only"> (เปิดในแท็บใหม่)</span>
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-ink-muted print:hidden">
            <Link href="/about" className="text-brand underline underline-offset-2">
              ดูรายละเอียดและข้อจำกัดของข้อมูล
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
