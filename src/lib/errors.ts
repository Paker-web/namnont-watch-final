// error ที่ adapter โยนออกมา เพื่อให้แคชรู้ว่าจะ backoff ยังไง

/** แหล่งข้อมูลตอบผิดปกติ (HTTP 429/5xx, timeout, เชื่อมต่อไม่ได้) */
export class UpstreamError extends Error {
  constructor(
    message: string,
    public status: number | null,
    /** จาก header Retry-After (มิลลิวินาที) ถ้ามี */
    public retryAfterMs?: number,
  ) {
    super(message);
    this.name = "UpstreamError";
  }
}

/** โครงสร้างข้อมูลไม่ตรงที่คาด (แหล่งข้อมูลเปลี่ยน schema) — ห้ามเดา ให้แจ้งว่าไม่พร้อมใช้งานแทน */
export class SchemaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SchemaError";
  }
}
