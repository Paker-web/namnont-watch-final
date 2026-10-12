import type { Metadata, Viewport } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import { RegisterSW } from "@/components/pwa/RegisterSW";
import { siteUrl } from "@/lib/site";

// ฟอนต์ไทย: next/font ดาวน์โหลดตอน build แล้วเสิร์ฟจากโดเมนเราเอง (เร็วและไม่เรียก Google ตอนผู้ใช้เปิดเว็บ)
const notoThai = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-noto-thai",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "น้ำนนท์ Watch — ติดตามสถานการณ์น้ำท่วมลุ่มน้ำเจ้าพระยา",
    template: "%s | น้ำนนท์ Watch",
  },
  description:
    "รวบรวมข้อมูลระดับน้ำ การระบายน้ำเขื่อน ฝน และวิธีเตรียมตัวรับน้ำท่วม เน้นนนทบุรี (ชื่อเว็บชั่วคราว)",
  icons: { apple: "/icons/apple-touch-icon.png" },
  openGraph: {
    type: "website",
    locale: "th_TH",
    siteName: "น้ำนนท์ Watch",
    title: "น้ำนนท์ Watch — ติดตามสถานการณ์น้ำท่วมลุ่มน้ำเจ้าพระยา",
    description: "ระดับน้ำ เขื่อน ฝน และวิธีเตรียมตัว เน้นนนทบุรี — ไม่ใช่ประกาศเตือนภัยอย่างเป็นทางการ",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "NamNon Watch" }],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#13232a" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className={notoThai.variable}>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-control focus:bg-brand focus:px-4 focus:py-2 focus:text-brand-ink"
        >
          ข้ามไปเนื้อหาหลัก
        </a>
        <Header />
        <main id="main" className="mx-auto w-full max-w-2xl flex-1 px-4 py-5">
          {children}
        </main>
        <Footer />
        <BottomNav />
        <RegisterSW />
      </body>
    </html>
  );
}
