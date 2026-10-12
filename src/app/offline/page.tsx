import type { Metadata } from "next";
import { WifiOff } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { ButtonLink } from "@/components/ui/ButtonLink";

export const metadata: Metadata = { title: "ออฟไลน์" };

// หน้านี้แสดงเมื่อเปิดหน้าข้อมูลสดตอนไม่มีอินเทอร์เน็ต (service worker เป็นผู้เรียก)
export default function OfflinePage() {
  return (
    <EmptyState
      icon={WifiOff}
      title="ไม่มีอินเทอร์เน็ต"
      description="หน้านี้ต้องใช้ข้อมูลสด เลยเปิดไม่ได้ตอนออฟไลน์ แต่เบอร์ฉุกเฉินและเช็กลิสต์ที่เคยเปิดไว้ยังดูได้ — ถ้าจำเป็นต้องขอความช่วยเหลือ โทร 1784 ได้ทันที"
      action={
        <div className="flex flex-wrap justify-center gap-2">
          <ButtonLink href="tel:1784" variant="call">โทร 1784</ButtonLink>
          <ButtonLink href="/help" variant="outline">เบอร์ฉุกเฉิน</ButtonLink>
          <ButtonLink href="/prepare" variant="outline">เช็กลิสต์</ButtonLink>
        </div>
      }
    />
  );
}
