import { ExternalLink } from "lucide-react";
import type { LinksData } from "@/lib/content-types";
import linksJson from "@data/links.json";

// กล่อง "ลิงก์ดูข้อมูลจริง" — แก้ลิงก์ที่ data/links.json
// url เป็น null = ยังไม่มีลิงก์ที่ตรวจแล้ว (ไม่เดาลิงก์ให้)
const { links } = linksJson as LinksData;
const isDev = process.env.NODE_ENV !== "production";

export function LinksBox({ ids, title = "ลิงก์ดูข้อมูลจริง" }: { ids?: string[]; title?: string }) {
  const items = ids ? links.filter((l) => ids.includes(l.id)) : links;
  return (
    <section aria-labelledby="links-box" className="rounded-card border border-line bg-surface p-4">
      <h2 id="links-box" className="mb-2 text-lg font-bold">{title}</h2>
      <ul className="space-y-1">
        {items.map((l) => (
          <li key={l.id}>
            {l.url ? (
              <a href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1.5 text-base font-medium text-brand underline underline-offset-2">
                {l.title}
                <ExternalLink className="h-4 w-4" aria-hidden />
                <span className="sr-only">(เปิดในแท็บใหม่)</span>
              </a>
            ) : (
              <p className="min-h-11 py-2 text-base text-ink-muted">
                {l.title} — ยังไม่มีลิงก์
                {isDev && l.todo && <span className="block text-sm text-lv-watch-fg">{l.todo}</span>}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
