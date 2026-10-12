import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // หน้าเรดาร์ย้ายมาที่ /weather
  async redirects() {
    return [{ source: "/radar", destination: "/weather", permanent: false }];
  },
  /* config options here */
};

export default nextConfig;
