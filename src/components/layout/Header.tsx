import Link from "next/link";
import { Droplets, LifeBuoy, Phone } from "lucide-react";

// แถบบนสุด: ชื่อเว็บ + ปุ่ม "ช่วยเหลือ" + ปุ่มโทร 1784 (ปภ.)
export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface pt-[env(safe-area-inset-top)] print:static">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-2 px-4 py-2">
        <Link href="/" className="flex min-h-11 items-center gap-2 font-bold">
          <Droplets className="h-6 w-6 text-brand" aria-hidden />
          <span className="text-lg leading-tight">น้ำนนท์ Watch</span>
        </Link>

        <nav aria-label="ช่วยเหลือและโทรฉุกเฉิน" className="flex items-center gap-2 print:hidden">
          <Link
            href="/help"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-control border-2 border-brand px-3 text-base font-semibold text-brand"
          >
            <LifeBuoy className="h-5 w-5" aria-hidden />
            ช่วยเหลือ
          </Link>
          <a
            href="tel:1784"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-control border-2 border-call bg-call px-3 text-base font-bold text-call-ink"
          >
            <Phone className="h-5 w-5" aria-hidden />
            โทร 1784
          </a>
        </nav>
      </div>
    </header>
  );
}
