import type { MetadataRoute } from "next";

// PWA: ติดตั้งลงหน้าจอโฮมได้ (Add to Home Screen)
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "น้ำนนท์ Watch — ติดตามสถานการณ์น้ำท่วม",
    short_name: "น้ำนนท์",
    description: "ระดับน้ำ เขื่อน ฝน และวิธีเตรียมตัวรับน้ำท่วมลุ่มน้ำเจ้าพระยา เน้นนนทบุรี",
    lang: "th",
    start_url: "/",
    display: "standalone",
    background_color: "#f3f7f6",
    theme_color: "#0a5c6e",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
