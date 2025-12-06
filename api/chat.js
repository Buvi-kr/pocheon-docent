export default async function handler(req, res) {
    // 1. CORS 설정
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );
  
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
  
    const { message, systemPrompt } = req.body;
    const API_KEY = process.env.GEMINI_API_KEY;
  
    if (!API_KEY) {
        return res.status(500).json({ error: "API 키가 설정되지 않았습니다." });
    }
  
    try {
      // 2. Google Gemini API 호출
      // ★ 핵심 수정: 주임님이 요청하신 최신 'gemini-2.5-flash-lite' 적용 ★
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: systemPrompt + "\n\nUser: " + message }]
            }
          ],
          // 안전 필터 해제
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
          ]
        })
      });
  
      const data = await response.json();
  
      // 에러 처리
      if (data.error) {
          console.error("Gemini API Error:", data.error);
          return res.status(500).json({ error: `AI 연결 오류: ${data.error.message}` });
      }
  
      if (!data.candidates || data.candidates.length === 0) {
          return res.status(500).json({ error: "AI가 답변을 생성하지 못했습니다." });
      }
  
      const aiResponse = data.candidates[0].content.parts[0].text;
      res.status(200).json({ reply: aiResponse });
  
    } catch (error) {
      console.error("Server Error:", error);
      res.status(500).json({ error: "서버 내부 오류가 발생했습니다." });
    }
  }
