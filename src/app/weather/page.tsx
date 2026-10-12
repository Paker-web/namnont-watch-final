import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { Suspense } from "react";
import { DataCard } from "@/components/ui/DataCard";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { AreaPicker } from "@/components/weather/AreaPicker";
import { ForecastPanel } from "@/components/weather/ForecastPanel";
import { RadarMapLazy } from "@/components/weather/RadarMapLazy";
import linksJson from "@data/links.json";
import type { LinksData } from "@/lib/content-types";
import { normalizeCoords, stationsConfig, weatherAreas } from "@/lib/services";

export const metadata: Metadata = { title: "เรดาร์และพยากรณ์ฝน" };
export const dynamic = "force-dynamic";

const tmd = (linksJson as LinksData).links.find((l) => l.id === "tmd-radar");

// /weather            → พื้นที่เริ่มต้น (เสาธงหิน)
// /weather?area=slug  → พื้นที่ในรายการ (data/weather-areas.json)
// /weather?lat=&lng=  → ตำแหน่งผู้ใช้ (ปัดพิกัด + ตรวจว่าอยู่ในไทย)
export default async function WeatherPage({ searchParams }: { searchParams: Promise<{ area?: string; lat?: string; lng?: string }> }) {
  const sp = await searchParams;
  let name = weatherAreas[0].name;
  let coords = normalizeCoords(weatherAreas[0].lat, weatherAreas[0].lng)!;
  let selected: string = weatherAreas[0].slug;
  let approx = true;

  const myCoords = sp.lat && sp.lng ? normalizeCoords(Number(sp.lat), Number(sp.lng)) : null;
  const area = weatherAreas.find((a) => a.slug === sp.area);
  if (myCoords) {
    name = "ตำแหน่งของคุณ";
    coords = myCoords;
    selected = "me";
  } else if (area) {
    name = area.name;
    coords = normalizeCoords(area.lat, area.lng) ?? coords;
    selected = area.slug;
    approx = area.approx;
  }

  return (
    <div className="space-y-6">
      <SectionTitle as="h1" description="เรดาร์ฝนย้อนหลังและพยากรณ์ ใช้ได้ตอนไม่มีน้ำท่วมด้วย">
        เรดาร์และพยากรณ์ฝน
      </SectionTitle>

      <section aria-labelledby="radar-h">
        <h2 id="radar-h" className="mb-2 text-xl font-bold">เรดาร์ฝน</h2>
        <RadarMapLazy home={stationsConfig.home} />
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-muted">
          <a href="https://www.rainviewer.com" target="_blank" rel="noopener noreferrer" className="text-brand underline underline-offset-2">Weather data by RainViewer</a>
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="text-brand underline underline-offset-2">© OpenStreetMap contributors</a>
        </div>
        {tmd?.url && (
          <a
            href={tmd.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex min-h-12 items-center gap-2 rounded-control border-2 border-brand bg-surface px-4 text-base font-semibold text-brand"
          >
            เรดาร์ทางการ กรมอุตุนิยมวิทยา
            <ExternalLink className="h-4 w-4" aria-hidden />
            <span className="sr-only">(เปิดในแท็บใหม่)</span>
          </a>
        )}
      </section>

      <section aria-labelledby="fc-h" className="space-y-4">
        <h2 id="fc-h" className="text-xl font-bold">พยากรณ์</h2>
        <AreaPicker areas={weatherAreas} selected={selected} />
        <Suspense key={`${coords.lat},${coords.lng}`} fallback={<DataCard title="กำลังโหลดพยากรณ์…" freshness="unavailable" />}>
          <ForecastPanel areaName={name} lat={coords.lat} lng={coords.lng} approx={approx || selected === "me"} />
        </Suspense>
      </section>
    </div>
  );
}
