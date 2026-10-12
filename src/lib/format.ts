// ฟังก์ชันจัดรูปแบบเวลา — ใช้เวลาไทย (Asia/Bangkok) และปี พ.ศ. เสมอ
const TZ = "Asia/Bangkok";

/** เช่น "30 ก.ย. 2569 14:05 น." */
export function formatThaiDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "ไม่ทราบเวลา";
  const date = new Intl.DateTimeFormat("th-TH", {
    timeZone: TZ,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
  const time = new Intl.DateTimeFormat("th-TH", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
  return `${date} ${time} น.`;
}

/** เช่น "5 นาทีที่แล้ว" */
export function formatTimeAgo(iso: string, nowMs: number): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "ไม่ทราบเวลา";
  const sec = Math.max(0, Math.floor((nowMs - t) / 1000));
  if (sec < 60) return "เมื่อสักครู่";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} นาทีที่แล้ว`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} ชั่วโมงที่แล้ว`;
  return `${Math.floor(hr / 24)} วันที่แล้ว`;
}
