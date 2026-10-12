"use client";

import { useId, useState } from "react";
import { AlertCircle, Check, Printer, RotateCcw } from "lucide-react";
import type { PrepareData } from "@/lib/content-types";
import { useChecklist } from "@/lib/use-checklist";

// เช็กลิสต์ 3 แท็บ: ก่อนเกิดเหตุ / ระหว่างน้ำท่วม / หลังน้ำลด
// เนื้อหามาจาก data/prepare.json — แก้ที่ไฟล์นั้นได้เลย
export function PrepareClient({ data }: { data: PrepareData }) {
  const uid = useId();
  const [activeId, setActiveId] = useState(data.tabs[0]?.id);
  const { checked, toggle, clearAll } = useChecklist();

  const countOf = (tabId: string) => {
    const tab = data.tabs.find((t) => t.id === tabId);
    const ids = tab?.groups.flatMap((g) => g.items.map((i) => i.id)) ?? [];
    return { done: ids.filter((id) => checked[id]).length, total: ids.length };
  };

  return (
    <div>
      {data.reviewStatus === "draft" && (
        <p className="mb-4 flex gap-2 rounded-control border-2 border-lv-watch-line bg-lv-watch-bg p-3 text-base text-lv-watch-fg">
          <AlertCircle className="mt-1 h-5 w-5 shrink-0" aria-hidden />
          <span>
            <strong>ร่างเนื้อหา</strong> — ยังรอตรวจสอบกับแนวทางของ ปภ. ตรวจประกาศทางการอีกครั้งก่อนปฏิบัติ
          </span>
        </p>
      )}

      {/* แท็บ (ซ่อนตอนพิมพ์ เพราะตอนพิมพ์จะพิมพ์ครบทั้ง 3 ส่วน) */}
      <div role="tablist" aria-label="ช่วงเวลา" className="grid grid-cols-3 gap-1 rounded-control bg-surface-2 p-1 print:hidden">
        {data.tabs.map((tab) => {
          const selected = tab.id === activeId;
          const { done, total } = countOf(tab.id);
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`${uid}-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`${uid}-panel-${tab.id}`}
              onClick={() => setActiveId(tab.id)}
              className={`flex min-h-14 flex-col items-center justify-center rounded-[0.6rem] px-1 py-1 text-center text-sm leading-tight ${
                selected
                  ? "border-2 border-brand bg-surface font-bold text-brand"
                  : "border-2 border-transparent font-medium text-ink-muted"
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-xs tabular-nums">
                {done}/{total}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-2 print:hidden">
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex min-h-12 items-center gap-2 rounded-control border-2 border-brand bg-surface px-4 text-base font-semibold text-brand"
        >
          <Printer className="h-5 w-5" aria-hidden />
          พิมพ์
        </button>
        <button
          type="button"
          onClick={() => {
            if (window.confirm("ล้างเครื่องหมายที่ติ๊กไว้ทั้งหมด?")) clearAll();
          }}
          className="inline-flex min-h-12 items-center gap-2 rounded-control border-2 border-line bg-surface px-4 text-base font-semibold text-ink-muted"
        >
          <RotateCcw className="h-5 w-5" aria-hidden />
          ล้างที่ติ๊ก
        </button>
      </div>

      {data.tabs.map((tab) => (
        <section
          key={tab.id}
          role="tabpanel"
          id={`${uid}-panel-${tab.id}`}
          aria-labelledby={`${uid}-tab-${tab.id}`}
          // จอปกติแสดงเฉพาะแท็บที่เลือก / ตอนพิมพ์แสดงทุกแท็บ
          className={`${tab.id === activeId ? "block" : "hidden"} mt-5 space-y-6 print:mt-6 print:block`}
        >
          <h2 className="hidden text-xl font-bold print:block">{tab.label}</h2>
          {tab.groups.map((group) => (
            <div key={group.title} className="break-inside-avoid">
              <h3 className="mb-2 text-lg font-bold">{group.title}</h3>
              <ul className="overflow-hidden rounded-card border border-line bg-surface">
                {group.items.map((item) => (
                  <li key={item.id} className="border-b border-line last:border-b-0">
                    <label className="flex min-h-14 cursor-pointer items-start gap-3 p-3">
                      <input
                        type="checkbox"
                        checked={!!checked[item.id]}
                        onChange={() => toggle(item.id)}
                        className="mt-0.5 h-6 w-6 shrink-0 accent-[var(--brand)]"
                      />
                      <span className="min-w-0">
                        <span className={`block text-base ${checked[item.id] ? "text-ink-muted" : ""}`}>
                          {item.text}
                          {checked[item.id] && (
                            <span className="ml-2 inline-flex items-center gap-0.5 text-sm font-semibold text-lv-ok-fg print:hidden">
                              <Check className="h-4 w-4" aria-hidden />
                              เรียบร้อย
                            </span>
                          )}
                        </span>
                        {item.detail && <span className="mt-0.5 block text-sm text-ink-muted">{item.detail}</span>}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
