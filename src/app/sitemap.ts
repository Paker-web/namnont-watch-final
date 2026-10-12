import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

const PATHS = ["/", "/water", "/weather", "/map", "/dams", "/prepare", "/help", "/about"];
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return PATHS.map((p) => ({ url: `${base}${p}`, changeFrequency: p === "/" ? "hourly" : "daily" }));
}
