// URL หลักของเว็บ (ใช้ใน sitemap / Open Graph / ปุ่มแชร์)
// ตั้งค่า NEXT_PUBLIC_SITE_URL ใน Vercel ถ้ามีโดเมนของตัวเอง ไม่งั้นใช้โดเมนที่ Vercel ให้
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return vercel ? `https://${vercel}` : "http://localhost:3000";
}
