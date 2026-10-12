import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

// ไม่ให้บอทเข้า /api (ข้อมูลดิบ ไม่มีประโยชน์ต่อการค้นหา และกันยิงซ้ำ)
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: "/", disallow: "/api/" }], sitemap: `${siteUrl()}/sitemap.xml` };
}
