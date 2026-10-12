import type { ReactNode } from "react";
import type { Freshness, SituationLevel, SourceRef } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";
import { TimeAgo } from "./TimeAgo";
import { ExternalLink } from "lucide-react";

// การ์ดข้อมูลมาตรฐาน — ทุกตัวเลขในเว็บต้องแสดงผ่านการ์ดนี้
// เพื่อให้มี: ค่า + หน่วย + เวลาอัปเดต + แหล่งที่มา + ป้ายสถานะ (สด/ค้าง/ไม่พร้อมใช้งาน) เหมือนกันทุกที่
//
// กติกา: ถ้าไม่มีข้อมูลจริง ให้ส่ง value={null} การ์ดจะแสดง "ยังไม่มีข้อมูล" ให้เอง (ห้ามใส่เลขสมมติ)

interface Props {
  title: string;
  value?: string | number | null;
  unit?: string;
  /** ความสดของข้อมูล; ถ้าไม่ระบุ: ไม่มีค่า = ไม่พร้อมใช้งาน, มีค่า = สด */
  freshness?: Freshness;
  /** ระดับสถานการณ์ของข้อมูลนี้ (ถ้ามี) */
  level?: SituationLevel;
  /** เวลาที่แหล่งข้อมูลอัปเดต (ISO 8601) */
  updatedAt?: string | null;
  source?: SourceRef;
  /** เนื้อหาเพิ่มเติมใต้ตัวเลข เช่น กราฟเล็ก คำอธิบาย */
  children?: ReactNode;
  /** แทนที่การแสดงตัวเลขด้วยเนื้อหาของเราเอง (เช่น ป้ายสถานะรวม) */
  valueSlot?: ReactNode;
  /** slot ท้ายการ์ด: ถ้าส่งมาจะใช้แทนบรรทัด "อัปเดต/แหล่งที่มา" มาตรฐาน */
  footer?: ReactNode;
}

const LEVEL_BORDER: Record<SituationLevel, string> = {
  ok: "border-l-lv-ok-line",
  watch: "border-l-lv-watch-line",
  warning: "border-l-lv-warning-line",
  critical: "border-l-lv-critical-line",
};

export function DataCard({
  title,
  value,
  unit,
  freshness,
  level,
  updatedAt,
  source,
  children,
  footer,
  valueSlot,
}: Props) {
  const hasValue = value !== null && value !== undefined && value !== "";
  const fresh: Freshness = freshness ?? (hasValue ? "live" : "unavailable");
  const accent = level ? LEVEL_BORDER[level] : "border-l-line";

  return (
    <article
      className={`rounded-card border border-l-8 border-line bg-surface p-4 ${accent}`}
    >
      <header className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold leading-snug">{title}</h3>
        <StatusBadge kind="freshness" value={fresh} />
      </header>

      <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        {valueSlot ? (
          valueSlot
        ) : hasValue ? (
          <>
            <span className="text-4xl font-bold tabular-nums leading-none">{value}</span>
            {unit && <span className="text-lg text-ink-muted">{unit}</span>}
          </>
        ) : (
          <span className="text-xl font-semibold text-ink-muted">ยังไม่มีข้อมูล</span>
        )}
        {level && (
          <span className="ml-auto">
            <StatusBadge kind="level" value={level} />
          </span>
        )}
      </div>

      {fresh === "stale" && (
        <p className="mt-2 text-sm text-lv-watch-fg">
          ข้อมูลนี้อาจไม่ใช่ค่าล่าสุด (ระบบใช้ข้อมูลที่บันทึกไว้เดิม)
        </p>
      )}

      {children && <div className="mt-3">{children}</div>}

      <footer className="mt-3 border-t border-line pt-2 text-sm text-ink-muted">
        {footer ?? (
          <dl className="space-y-0.5">
            <div className="flex gap-1.5">
              <dt>อัปเดต:</dt>
              <dd>{updatedAt ? <TimeAgo iso={updatedAt} /> : "ยังไม่มีข้อมูล"}</dd>
            </div>
            <div className="flex gap-1.5">
              <dt>แหล่งที่มา:</dt>
              <dd>
                {source?.url ? (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-brand underline underline-offset-2"
                  >
                    {source.name}
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                    <span className="sr-only">(เปิดในแท็บใหม่)</span>
                  </a>
                ) : (
                  (source?.name ?? "ยังไม่ได้เชื่อมต่อ")
                )}
              </dd>
            </div>
          </dl>
        )}
      </footer>
    </article>
  );
}
