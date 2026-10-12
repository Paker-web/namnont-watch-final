"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, TileLayer } from "leaflet";
import { Pause, Play } from "lucide-react";
import { Notice } from "@/components/ui/Notice";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TimeAgo } from "@/components/ui/TimeAgo";
import { formatThaiDateTime } from "@/lib/format";

// แผนที่เรดาร์ฝน: Leaflet + OpenStreetMap + เลเยอร์เรดาร์ RainViewer (ย้อนหลัง 2 ชม. ทุก 10 นาที)
// - รายการเฟรมมาจาก /api/radar (ผ่านแคชของเรา)
// - โหลด tile ทีละเฟรมตอนแสดงเท่านั้น เพื่อไม่ให้เกินข้อจำกัด 100 คำขอ/IP/นาทีของ RainViewer
// - tile ซูมได้สูงสุด 7 (free tier) → ตั้ง maxNativeZoom=7 ให้ Leaflet ขยายภาพ (ภาพจะหยาบ ใช้ดูทิศทางฝนเท่านั้น)
// - เครดิต: "Weather data by RainViewer" + © OpenStreetMap contributors

interface RadarResponse {
  host: string | null;
  frames: { time: string; path: string }[];
  tile: { size: number; color: number; options: string; maxNativeZoom: number };
  stale: boolean;
  unavailable: boolean;
  error?: string;
}

const REFRESH_MS = 5 * 60_000;
const FRAME_MS = 700;

export function RadarMap({ home }: { home: { lat: number; lng: number; name: string; verified: boolean } }) {
  const box = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const layers = useRef(new Map<string, TileLayer>());
  const current = useRef<TileLayer | null>(null);

  const [radar, setRadar] = useState<RadarResponse | null>(null);
  const [failed, setFailed] = useState(false);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  // 1) สร้างแผนที่ครั้งเดียว
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !box.current || mapRef.current) return;
      leafletRef.current = L;
      const map = L.map(box.current, {
        center: [home.lat, home.lng],
        zoom: 8,
        minZoom: 5,
        maxZoom: 10,
        // มือถือ: ปิดการลากนิ้วเดียว เพื่อให้เลื่อนหน้าเว็บผ่านแผนที่ได้ (ใช้สองนิ้วเลื่อน/ซูมได้)
        dragging: !L.Browser.mobile,
        scrollWheelZoom: false,
      });
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);
      L.circleMarker([home.lat, home.lng], { radius: 7, color: "#b3261e", weight: 3, fillColor: "#fff", fillOpacity: 1 })
        .addTo(map)
        .bindTooltip(`${home.name}${home.verified ? "" : " (โดยประมาณ)"}`);
      mapRef.current = map;
      setMapReady(true);
    })();
    const tiles = layers.current;
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      tiles.clear();
      current.current = null;
    };
  }, [home.lat, home.lng, home.name, home.verified]);

  // 2) โหลดรายการเฟรม และรีเฟรชทุก 5 นาที
  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const res = await fetch("/api/radar");
        const json: RadarResponse = await res.json();
        if (!alive) return;
        setRadar(json);
        setFailed(json.unavailable);
        setIdx((i) => (json.frames.length ? Math.min(i === 0 ? json.frames.length - 1 : i, json.frames.length - 1) : 0));
      } catch {
        if (alive) setFailed(true);
      }
    }
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  // 3) แสดงเฟรมที่เลือก (สร้าง layer เมื่อต้องใช้ครั้งแรก)
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!mapReady || !L || !map || !radar?.host || !radar.frames[idx]) return;
    const frame = radar.frames[idx];
    let layer = layers.current.get(frame.time);
    if (!layer) {
      const { size, color, options, maxNativeZoom } = radar.tile;
      layer = L.tileLayer(`${radar.host}${frame.path}/${size}/{z}/{x}/{y}/${color}/${options}.png`, {
        tileSize: size,
        opacity: 0.65,
        maxNativeZoom,
        maxZoom: 10,
        attribution: '<a href="https://www.rainviewer.com" target="_blank" rel="noopener noreferrer">Weather data by RainViewer</a>',
      });
      layers.current.set(frame.time, layer);
    }
    if (current.current && current.current !== layer) map.removeLayer(current.current);
    if (!map.hasLayer(layer)) layer.addTo(map);
    current.current = layer;
  }, [idx, radar, mapReady]);

  // 4) เล่น/หยุด
  const total = radar?.frames.length ?? 0;
  useEffect(() => {
    if (!playing || total < 2) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % total), FRAME_MS);
    return () => clearInterval(id);
  }, [playing, total]);

  const frame = radar?.frames[idx];
  const newest = radar?.frames[total - 1];

  return (
    <div className="space-y-3">
      {failed && (
        <Notice tone="error">
          <strong>เรดาร์ไม่พร้อมใช้งานชั่วคราว</strong> — {radar?.error ?? "ดึงข้อมูลเรดาร์ไม่สำเร็จ"} ใช้เรดาร์ทางการของกรมอุตุนิยมวิทยาแทนได้ (ปุ่มด้านล่าง)
        </Notice>
      )}
      {!failed && radar?.stale && (
        <Notice tone="warn">
          <strong>ข้อมูลค้าง</strong> — กำลังแสดงรายการเฟรมที่บันทึกไว้ อาจไม่ใช่ภาพล่าสุด
        </Notice>
      )}

      <div
        ref={box}
        role="img"
        aria-label="แผนที่เรดาร์ฝนบริเวณนนทบุรีและพื้นที่ใกล้เคียง"
        className="z-0 h-[52vh] min-h-80 w-full overflow-hidden rounded-card border border-line bg-surface-2"
      />

      <div className="rounded-card border border-line bg-surface p-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            disabled={total < 2}
            aria-label={playing ? "หยุดเล่น" : "เล่นภาพเรดาร์ย้อนหลัง"}
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-control border-2 border-brand bg-brand text-brand-ink disabled:opacity-50"
          >
            {playing ? <Pause className="h-6 w-6" aria-hidden /> : <Play className="h-6 w-6" aria-hidden />}
          </button>
          <div className="min-w-0 flex-1">
            <input
              type="range"
              min={0}
              max={Math.max(0, total - 1)}
              value={Math.min(idx, Math.max(0, total - 1))}
              onChange={(e) => {
                setPlaying(false);
                setIdx(Number(e.target.value));
              }}
              disabled={total < 2}
              aria-label="เลือกช่วงเวลาของภาพเรดาร์"
              aria-valuetext={frame ? formatThaiDateTime(frame.time) : "ไม่มีข้อมูล"}
              className="h-8 w-full accent-[var(--brand)]"
            />
            <p className="text-base font-semibold">{frame ? formatThaiDateTime(frame.time) : "กำลังโหลดเรดาร์…"}</p>
          </div>
        </div>
        <dl className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line pt-2 text-sm text-ink-muted">
          <div className="flex items-center gap-1.5">
            <dt>สถานะ:</dt>
            <dd><StatusBadge kind="freshness" value={failed || !radar ? "unavailable" : radar.stale ? "stale" : "live"} /></dd>
          </div>
          {newest && (
            <div className="flex gap-1.5">
              <dt>ภาพล่าสุด:</dt>
              <dd><TimeAgo iso={newest.time} /></dd>
            </div>
          )}
        </dl>
      </div>

      <p className="text-sm text-ink-muted">
        ภาพเรดาร์ย้อนหลัง 2 ชั่วโมง (ไม่ใช่พยากรณ์) ความละเอียดต่ำเพราะแหล่งข้อมูลฟรีจำกัดการซูม ·{" "}
        <span className="sm:hidden">ใช้สองนิ้วเลื่อน/ซูมแผนที่ · </span>
        จุดวงกลมคือ {home.name}
        {home.verified ? "" : " (โดยประมาณ)"}
      </p>
    </div>
  );
}
