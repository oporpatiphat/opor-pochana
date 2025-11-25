import { GoogleGenAI } from "@google/genai";
import { Tier } from '../types';

// ใช้ (import.meta as any) เพื่อบังคับให้ TypeScript ยอมรับการดึงค่าจาก Vite
const ai = new GoogleGenAI({ apiKey: (import.meta as any).env.VITE_API_KEY });

const SYSTEM_PROMPT = `
คุณคือ "เชฟโอปอ" เจ้าของร้าน "โอปอโภชนา" (Opor Pochana) ร้านอาหารอีสานรสเด็ดระดับตำนาน
บุคลิก:
- ใจดี สนุกสนาน เป็นกันเอง (ใช้คำแทนตัวว่า "เชฟ" หรือ "พี่โอปอ")
- มีความรู้เรื่องอาหารอีสานลึกซึ้ง
- ชอบแนะนำการจับคู่เมนู (Food Pairing)
- ถ้าลูกค้าเป็นระดับ Gold ให้ดูแลแบบ VIP อวยยศหน่อยๆ

หน้าที่:
- แนะนำเมนูอาหาร
- ตอบคำถามลูกค้าเกี่ยวกับอาหาร
- ชวนคุยเรื่องการกินให้อร่อย
`;

export const getChefRecommendation = async (tier: Tier, points: number, memberName: string): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    const prompt = `
      ${SYSTEM_PROMPT}
      
      ข้อมูลลูกค้า:
      ชื่อ: ${memberName}
      ระดับ: ${tier}
      แต้ม: ${points}

      โจทย์: ทักทายลูกค้าสั้นๆ และแนะนำเมนูเด็ดประจำวันนี้ 1 อย่างให้น่าทานที่สุด (ไม่เกิน 2 ประโยค)
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "วันนี้เชฟขอแนะนำ ส้มตำไทยไข่เค็ม รสเด็ดครับ!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return `สวัสดีครับคุณ ${memberName}! วันนี้รับตำถาดแซ่บๆ สักที่ไหมครับ?`;
  }
};

export const chatWithChef = async (message: string, tier: Tier, memberName: string): Promise<string> => {
    try {
        const model = 'gemini-2.5-flash';
        const prompt = `
            ${SYSTEM_PROMPT}

            ข้อมูลลูกค้า:
            ชื่อ: ${memberName} (${tier})

            ลูกค้าถามว่า: "${message}"

            ตอบคำถามลูกค้าแบบสั้นๆ กระชับ ได้ใจความ และเป็นกันเอง:
        `;

        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });

        return response.text || "เชฟกำลังยุ่งหน้าเตา แต่แนะนำให้ลองลาบเป็ดครับ!";
    } catch (error) {
        return "ขออภัยครับ เชฟกำลังตำส้มตำอยู่ ไม่ทันได้ยินครับ";
    }
}
