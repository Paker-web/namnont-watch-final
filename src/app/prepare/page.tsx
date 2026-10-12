import type { Metadata } from "next";
import { PrepareClient } from "@/components/prepare/PrepareClient";
import { SectionTitle } from "@/components/ui/SectionTitle";
import type { PrepareData } from "@/lib/content-types";
import prepareJson from "@data/prepare.json";

export const metadata: Metadata = { title: "เตรียมตัว" };

// เนื้อหาเช็กลิสต์อยู่ที่ data/prepare.json — แก้ที่นั่นได้โดยไม่ต้องแตะโค้ด
export default function PreparePage() {
  return (
    <>
      <SectionTitle as="h1" description="ติ๊กเมื่อทำแล้ว ระบบจำไว้ในเครื่องของคุณ">
        เตรียมตัวรับน้ำท่วม
      </SectionTitle>
      <PrepareClient data={prepareJson as PrepareData} />
    </>
  );
}
