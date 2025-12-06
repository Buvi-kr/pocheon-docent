// api/chat.js
export default async function handler(req, res) {
    // 1. CORS 설정 (누구나 접속 가능하게 허용)
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
  
    // 2. 프론트엔드에서 보낸 질문 받기
    const { message, systemPrompt } = req.body;
    
    // Vercel 환경변수에서 API 키 가져오기 (보안 핵심!)
    const API_KEY = process.env.GEMINI_API_KEY;
  
    if (!API_KEY) {
        return res.status(500).json({ error: "API 키가 설정되지 않았습니다." });
    }
  
    try {
      // 3. Google Gemini API 호출
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: systemPrompt + "\n\nUser: " + message }]
            }
          ]
        })
      });
  
      const data = await response.json();
      const aiResponse = data.candidates[0].content.parts[0].text;
  
      // 4. 결과 반환
      res.status(200).json({ reply: aiResponse });
  
    } catch (error) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: "AI 응답을 가져오는데 실패했습니다." });
    }
  }