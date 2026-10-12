"use client";

import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Map as LeafletMap, MarkerClusterGroup, Marker } from "leaflet";
import { ChevronDown, ChevronUp, LocateFixed } from "lucide-react";
import { distanceKm } from "@/lib/geo";
import { OWNER_LABEL, TYPE_LABEL, TYPE_LETTER, places, type Place, type PlaceType } from "@/lib/places";
import { PlaceCard } from "./PlaceCard";

// แผนที่จุดอพยพ/ที่จอดรถ: Leaflet + OpenStreetMap + marker cluster
// - เริ่มที่รัศมี 5 กม. รอบเสาธงหิน · ตัวกรอง จังหวัด/ประเภท/รัฐ-เอกชน/จอดฟรี/เปิดอยู่
// - รายการเป็น bottom sheet บนมือถือ เรียงตามระยะจากตำแหน่งฉัน (ถ้าไม่เปิดตำแหน่ง = ระยะจากเสาธงหิน)
// - ตำแหน่งผู้ใช้อยู่ในเบราว์เซอร์เท่านั้น ไม่ถูกส่งไปที่ไหน

interface Home { lat: number; lng: number; name: string; verified: boolean }
type Filters = { province: string; type: "all" | PlaceType; owner: "all" | Place["owner"]; freeOnly: boolean; openOnly: boolean };

const INITIAL_RADIUS_M = 5000;
const selectCls = "min-h-12 w-full rounded-control border-2 border-line bg-surface px-3 text-base";

export function MapClient({ home }: { home: Home }) {
  const box = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const clusterRef = useRef<MarkerClusterGroup | null>(null);
  const markers = useRef(new Map<string, Marker>());
  const meMarker = useRef<Marker | null>(null);

  const [nowMs] = useState(() => Date.now()); // ใช้คำนวณอายุข้อมูล (คอมโพเนนต์นี้เรนเดอร์ฝั่งเบราว์เซอร์เท่านั้น)
  const [filters, setFilters] = useState<Filters>({ province: "all", type: "all", owner: "all", freeOnly: false, openOnly: false });
  const [me, setMe] = useState<{ lat: number; lng: number } | null>(null);
  const [geoMsg, setGeoMsg] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  const provinces = useMemo(() => [...new Set(places.map((p) => p.province))], []);
  const origin = me ?? home;

  const visible = useMemo(() => {
    return places
      .filter((p) => (filters.province === "all" || p.province === filters.province)
        && (filters.type === "all" || p.type === filters.type)
        && (filters.owner === "all" || p.owner === filters.owner)
        && (!filters.freeOnly || p.is_free)
        && (!filters.openOnly || p.status === "open"))
      .map((p) => ({ p, d: distanceKm(origin.lat, origin.lng, p.lat as number, p.lng as number) }))
      .sort((a, b) => a.d - b.d);
  }, [filters, origin.lat, origin.lng]);

  // 1) สร้างแผนที่ครั้งเดียว
  useEffect(() => {
    let cancelled = false;
    const markerStore = markers.current;
    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet.markercluster");
      if (cancelled || !box.current || mapRef.current) return;
      leafletRef.current = L;
      const map = L.map(box.current, { center: [home.lat, home.lng], zoom: 13, maxZoom: 18, dragging: !L.Browser.mobile, scrollWheelZoom: false });
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);
      // รัศมี 5 กม. รอบเสาธงหิน
      const ring = L.circle([home.lat, home.lng], { radius: INITIAL_RADIUS_M, color: "#b3261e", weight: 2, dashArray: "6 6", fill: false }).addTo(map);
      L.circleMarker([home.lat, home.lng], { radius: 6, color: "#b3261e", fillColor: "#fff", fillOpacity: 1, weight: 3 })
        .addTo(map).bindTooltip(`${home.name}${home.verified ? "" : " (โดยประมาณ)"}`);
      map.fitBounds(ring.getBounds());
      clusterRef.current = L.markerClusterGroup({ showCoverageOnHover: false, maxClusterRadius: 45 }).addTo(map);
      mapRef.current = map;
      setMapReady(true);
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      clusterRef.current = null;
      markerStore.clear();
    };
  }, [home.lat, home.lng, home.name, home.verified]);

  // 2) วาดหมุดใหม่เมื่อตัวกรองเปลี่ยน
  useEffect(() => {
    const L = leafletRef.current;
    const cluster = clusterRef.current;
    if (!mapReady || !L || !cluster) return;
    cluster.clearLayers();
    markers.current.clear();
    for (const { p } of visible) {
      const icon = L.divIcon({
        className: "",
        html: `<div class="pin pin-${p.type}" aria-hidden="true"><span>${TYPE_LETTER[p.type]}</span></div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });
      const m = L.marker([p.lat as number, p.lng as number], { icon, title: p.name, alt: p.name, keyboard: true });
      m.on("click", () => {
        setSelectedId(p.id);
        setSheetOpen(true);
      });
      m.bindTooltip(p.name);
      markers.current.set(p.id, m);
      cluster.addLayer(m);
    }
  }, [visible, mapReady]);

  // 3) เมื่อเลือกจุด → เลื่อนแผนที่ไปหา + เลื่อนรายการมาที่การ์ด
  useEffect(() => {
    if (!selectedId) return;
    const p = places.find((x) => x.id === selectedId);
    if (p && mapRef.current) mapRef.current.flyTo([p.lat as number, p.lng as number], Math.max(mapRef.current.getZoom(), 15), { duration: 0.6 });
    document.getElementById(`place-${selectedId}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedId]);

  // 4) หมุดตำแหน่งของฉัน
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!mapReady || !L || !map || !me) return;
    meMarker.current?.remove();
    meMarker.current = L.marker([me.lat, me.lng], { icon: L.divIcon({ className: "", html: '<div class="pin pin-me" aria-hidden="true"></div>', iconSize: [20, 20], iconAnchor: [10, 10] }), title: "ตำแหน่งของฉัน" })
      .addTo(map).bindTooltip("ตำแหน่งของฉัน");
    map.flyTo([me.lat, me.lng], 14, { duration: 0.6 });
  }, [me, mapReady]);

  function locate() {
    if (!("geolocation" in navigator)) return setGeoMsg("เบราว์เซอร์นี้ไม่รองรับการหาตำแหน่ง");
    setGeoMsg("กำลังหาตำแหน่ง…");
    navigator.geolocation.getCurrentPosition(
      (pos) => { setMe({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setGeoMsg(null); },
      () => setGeoMsg("หาตำแหน่งไม่ได้ (อาจยังไม่ได้อนุญาต) — รายการยังเรียงตามระยะจากเสาธงหิน"),
      { enableHighAccuracy: true, timeout: 15_000 },
    );
  }

  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => setFilters((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-3">
      {/* ตัวกรอง */}
      <div className="grid grid-cols-1 gap-2 rounded-card border border-line bg-surface p-3 sm:grid-cols-3">
        <label className="text-sm font-semibold">จังหวัด
          <select className={`${selectCls} mt-1 font-normal`} value={filters.province} onChange={(e) => set("province", e.target.value)}>
            <option value="all">ทุกจังหวัด</option>
            {provinces.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold">ประเภท
          <select className={`${selectCls} mt-1 font-normal`} value={filters.type} onChange={(e) => set("type", e.target.value as Filters["type"])}>
            <option value="all">ทุกประเภท</option>
            {(Object.keys(TYPE_LABEL) as PlaceType[]).map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold">รัฐ / เอกชน
          <select className={`${selectCls} mt-1 font-normal`} value={filters.owner} onChange={(e) => set("owner", e.target.value as Filters["owner"])}>
            <option value="all">ทั้งหมด</option>
            {(Object.keys(OWNER_LABEL) as (keyof typeof OWNER_LABEL)[]).map((o) => <option key={o} value={o}>{OWNER_LABEL[o]}</option>)}
          </select>
        </label>
        <label className="flex min-h-12 items-center gap-3 text-base font-medium">
          <input type="checkbox" className="h-6 w-6 accent-[var(--brand)]" checked={filters.freeOnly} onChange={(e) => set("freeOnly", e.target.checked)} />จอดฟรี/ไม่เสียค่าบริการ
        </label>
        <label className="flex min-h-12 items-center gap-3 text-base font-medium">
          <input type="checkbox" className="h-6 w-6 accent-[var(--brand)]" checked={filters.openOnly} onChange={(e) => set("openOnly", e.target.checked)} />เปิดอยู่เท่านั้น
        </label>
        <button type="button" onClick={locate} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control border-2 border-brand bg-surface px-3 text-base font-semibold text-brand">
          <LocateFixed className="h-5 w-5" aria-hidden />{me ? "อัปเดตตำแหน่งฉัน" : "ใช้ตำแหน่งฉัน"}
        </button>
        {geoMsg && <p role="status" className="text-sm text-lv-watch-fg sm:col-span-3">{geoMsg}</p>}
      </div>

      <div ref={box} role="application" aria-label="แผนที่จุดอพยพและที่จอดรถ" className="relative z-0 h-[48vh] min-h-72 w-full overflow-hidden rounded-card border border-line bg-surface-2" />
      <p className="text-sm text-ink-muted">
        วงเส้นประ = รัศมี 5 กม. รอบ {home.name}{home.verified ? "" : " (พิกัดโดยประมาณ)"} · <span className="sm:hidden">ใช้สองนิ้วเลื่อน/ซูมแผนที่ · </span>
        หมุด: อ = จุดอพยพ, พ = ศูนย์พักพิง, จ = ที่จอดรถ
      </p>

      {/* รายการ: bottom sheet บนมือถือ / บล็อกปกติบนจอใหญ่ */}
      <section
        aria-label="รายการจุด"
        className="fixed inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-20 mx-auto max-w-2xl rounded-t-card border border-line bg-bg shadow-[0_-4px_14px_rgba(0,0,0,0.25)] sm:static sm:rounded-card sm:shadow-none"
      >
        <button
          type="button"
          onClick={() => setSheetOpen((o) => !o)}
          aria-expanded={sheetOpen}
          className="flex min-h-14 w-full items-center justify-between gap-2 px-4 text-left sm:pointer-events-none"
        >
          <span className="text-base font-bold">พบ {visible.length} จุด <span className="text-sm font-normal text-ink-muted">เรียงตามระยะจาก{me ? "ตำแหน่งฉัน" : "เสาธงหิน"}</span></span>
          <span className="sm:hidden">{sheetOpen ? <ChevronDown className="h-6 w-6" aria-hidden /> : <ChevronUp className="h-6 w-6" aria-hidden />}<span className="sr-only">{sheetOpen ? "ย่อรายการ" : "ขยายรายการ"}</span></span>
        </button>
        <div className={`${sheetOpen ? "block" : "hidden"} max-h-[50vh] space-y-3 overflow-y-auto px-3 pb-3 sm:block sm:max-h-none sm:overflow-visible`}>
          {visible.length === 0 ? (
            <p className="rounded-card border-2 border-dashed border-line bg-surface p-4 text-center text-base text-ink-muted">ไม่พบจุดตามตัวกรองนี้ ลองลดเงื่อนไขการกรอง</p>
          ) : (
            visible.map(({ p, d }) => (
              <PlaceCard key={p.id} place={p} distanceKm={d} nowMs={nowMs} selected={p.id === selectedId} onSelect={() => setSelectedId(p.id)} />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
