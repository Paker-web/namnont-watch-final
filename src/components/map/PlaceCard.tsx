import { BadgeCheck, Clock, MapPin, Navigation, Phone, PhoneCall, Users } from "lucide-react";
import { OWNER_LABEL, STATUS_LABEL, TYPE_LABEL, FRESH_DAYS, ageDays, type Place } from "@/lib/places";

// การ์ดจุดอพยพ/ที่จอดรถ: ชื่อ ที่อยู่ เบอร์ เวลา ความจุ วันที่ตรวจล่าสุด + ปุ่มนำทาง
// badge อายุข้อมูล: ตรวจภายใน 7 วัน = เขียว / เก่ากว่านั้น = เทา "ควรโทรยืนยัน"
export function PlaceCard({ place: p, distanceKm, nowMs, selected, onSelect }: {
  place: Place;
  distanceKm: number | null;
  nowMs: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const age = ageDays(p.verified_at, nowMs);
  const fresh = age <= FRESH_DAYS;
  const dir = p.lat !== null && p.lng !== null ? `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}` : null;

  return (
    <article
      id={`place-${p.id}`}
      className={`rounded-card border-2 bg-surface p-3 ${selected ? "border-brand" : "border-line"}`}
    >
      <button type="button" onClick={onSelect} className="block w-full text-left" aria-label={`ดูบนแผนที่: ${p.name}`}>
        <h3 className="text-base font-bold leading-snug">{p.name}</h3>
        <p className="mt-0.5 text-sm text-ink-muted">
          {TYPE_LABEL[p.type]} · {OWNER_LABEL[p.owner]} · {p.is_free ? "ไม่เสียค่าบริการ" : "มีค่าบริการ"} · {STATUS_LABEL[p.status]}
          {distanceKm !== null && ` · ห่างประมาณ ${distanceKm.toFixed(1)} กม.`}
        </p>
      </button>

      {p.sample && (
        <p className="mt-2 rounded-control border-2 border-lv-warning-line bg-lv-warning-bg px-2 py-1 text-sm font-semibold text-lv-warning-fg">
          ข้อมูลตัวอย่าง — ไม่ใช่สถานที่จริง
        </p>
      )}

      <ul className="mt-2 space-y-1 text-base">
        {(p.address || p.subdistrict) && (
          <li className="flex gap-2"><MapPin className="mt-1 h-4 w-4 shrink-0" aria-hidden />{[p.address, p.subdistrict && `ต.${p.subdistrict}`, p.district && `อ.${p.district}`].filter(Boolean).join(" ")}</li>
        )}
        <li className="flex gap-2"><Clock className="mt-1 h-4 w-4 shrink-0" aria-hidden />{p.hours || "ยังไม่มีข้อมูลเวลาเปิด"}</li>
        <li className="flex gap-2"><Users className="mt-1 h-4 w-4 shrink-0" aria-hidden />ความจุ: {p.capacity !== null ? `${p.capacity} คน/คัน` : "ยังไม่มีข้อมูล"}</li>
        <li className="flex gap-2">
          <Phone className="mt-1 h-4 w-4 shrink-0" aria-hidden />
          {p.phone ? <a className="font-semibold text-brand underline underline-offset-2" href={`tel:${p.phone.replace(/[^\d+]/g, "")}`}>{p.phone}</a> : "ยังไม่มีเบอร์โทร"}
        </li>
      </ul>

      <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-line pt-2">
        {fresh ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-lv-ok-line bg-lv-ok-bg px-2.5 py-0.5 text-sm font-semibold text-lv-ok-fg">
            <BadgeCheck className="h-4 w-4" aria-hidden />ตรวจแล้ว {age === 0 ? "วันนี้" : `${age} วันที่แล้ว`}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-lv-none-line bg-lv-none-bg px-2.5 py-0.5 text-sm font-semibold text-lv-none-fg">
            <PhoneCall className="h-4 w-4" aria-hidden />ควรโทรยืนยัน (ตรวจเมื่อ {p.verified_at})
          </span>
        )}
        {dir && !p.sample && (
          <a href={dir} target="_blank" rel="noopener noreferrer" className="ml-auto inline-flex min-h-11 items-center gap-1.5 rounded-control border-2 border-brand bg-brand px-3 text-base font-bold text-brand-ink">
            <Navigation className="h-5 w-5" aria-hidden />นำทาง<span className="sr-only"> (เปิดใน Google Maps แท็บใหม่)</span>
          </a>
        )}
      </div>
      {p.flood_safe_note && !p.sample && <p className="mt-2 text-sm text-ink-muted">หมายเหตุ: {p.flood_safe_note}</p>}
    </article>
  );
}
