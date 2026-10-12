# น้ำนนท์ Watch (ชื่อชั่วคราว)

เว็บติดตามสถานการณ์น้ำท่วมลุ่มน้ำเจ้าพระยา เน้นนนทบุรี — Next.js (App Router) + TypeScript + Tailwind

## รันในเครื่อง
```bash
npm install
npm run dev      # เปิด http://localhost:3000
npm run build    # ทดสอบ build ก่อน deploy
```

## แก้เนื้อหาโดยไม่ต้องแตะโค้ด (โฟลเดอร์ /data)
- `data/prepare.json`  เช็กลิสต์หน้า "เตรียมตัว" (ตรวจแล้วเปลี่ยน `reviewStatus` เป็น `"reviewed"`)
- `data/contacts.json` เบอร์โทร (เติมเบอร์ท้องถิ่นที่ `number: null` ทีละรายการ)
- `data/sources.json`  รายชื่อแหล่งข้อมูล (ตรวจลิงก์แล้วเปลี่ยน `verified` เป็น `true`)

## แก้สี/ฟอนต์/ระยะ
ไฟล์เดียว: `src/app/globals.css` (Design tokens)

## โครงสร้าง
- `src/app/*` หน้าเว็บ · `src/components/ui/*` คอมโพเนนต์กลาง · `src/lib/*` ฟังก์ชันและชนิดข้อมูล
- เฟสถัดไป: `src/lib/sources/*.ts` (adapter) และ `src/app/api/*` (Route Handler)

## เฟส 2 (ระดับน้ำ + ฝน — ส่วนหลังบ้าน)
- `npm run probe` เรียก ThaiWater จริง พิมพ์ตัวอย่าง response + รายชื่อสถานี นนทบุรี/อยุธยา/ปทุมธานี (บันทึกดิบที่ `.probe/`)
- `npm run mock` เซิร์ฟเวอร์จำลอง ThaiWater (พอร์ต 4010) ใช้ทดสอบ 429 / ตัดเน็ต:
  `THAIWATER_BASE_URL=http://localhost:4010 npm run dev` แล้ว `curl localhost:4010/__mode/429` (หรือ ok / 500 / hang)
- `/api/water?province=นนทบุรี|ayutthaya|pathumthani`, `/api/rain`
- เกณฑ์สถานะทั้งหมดอยู่ที่ `src/lib/status-rules.ts` · ตั้งค่าสถานีหลักที่ `data/stations.json`

## เฟส 3–5 และการปิดงาน
| หน้า | เนื้อหา | แหล่งข้อมูล |
|---|---|---|
| `/` | สถานะรวม · ระบายเขื่อน · ฝน 24 ชม. · ฝน 6 ชม.ข้างหน้า · ปุ่มโทร | ทุกแหล่งด้านล่าง |
| `/water` | แท็บ 3 จังหวัด · การ์ดสถานี · ตารางตามความเสี่ยง · ลิงก์ | ThaiWater |
| `/weather` | เรดาร์ฝน (เล่น animation) · พยากรณ์ 6 ชม./48 ชม./7 วัน | RainViewer, Open-Meteo |
| `/map` | จุดอพยพ/ที่จอดรถ + กรอง + รายการ bottom sheet | `data/places.json` + OSM |
| `/dams` | เขื่อนใหญ่ + ประกาศระบายน้ำเจ้าพระยา (AI สรุป) | กรมชลประทาน + `data/announcements.json` |

- `npm run validate:places` ตรวจ `data/places.json` (รันอัตโนมัติก่อน `npm run build`)
- `npm run test:scripts` ทดสอบสคริปต์ประกาศ (ไม่ใช้เน็ต) · `npm run update:announcements` รันดึงประกาศเอง
- `.github/workflows/update.yml` รันทุก 3 ชม. (ต้องตั้ง secret `GEMINI_API_KEY`)
- เกณฑ์สถานะ/ฝน: `src/lib/status-rules.ts`, `src/lib/weather-summary.ts` · สถานีหลัก/พิกัด: `data/stations.json`
- เงื่อนไขแหล่งข้อมูล: RainViewer ฟรี = เรดาร์ย้อนหลัง 2 ชม., ซูม ≤ 7, 100 คำขอ/IP/นาที · ต้องใส่เครดิตทุกแหล่ง (มีในหน้าแล้ว)
