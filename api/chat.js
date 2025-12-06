// api/chat.js
// 이 코드는 Vercel 서버에서 돌아가며, Gemini API와 통신합니다.

export default async function handler(req, res) {
    // 1. CORS 설정 (프론트엔드에서 접속 허용)
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );
  
    // 브라우저의 사전 체크(Pre-flight) 요청 처리
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
  
    // 2. 프론트엔드(index.html)에서 보낸 데이터 받기
    const { message, systemPrompt } = req.body;
    
    // 3. Vercel 환경변수에서 API 키 가져오기
    const API_KEY = process.env.GEMINI_API_KEY;
  
    if (!API_KEY) {
        return res.status(500).json({ error: "API 키가 Vercel Settings에 설정되지 않았습니다." });
    }
  
    try {
      // 4. Google Gemini API 호출 (모델: gemini-2.5-flash-lite)
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: systemPrompt + "\n\nUser Question: " + message }]
            }
          ],
          // 안전 필터 해제 (천문학 용어나 질문이 막히지 않도록)
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
          ]
        })
      });
  
      const data = await response.json();
  
      // 5. 에러 처리
      if (data.error) {
          console.error("Gemini API Error:", data.error);
          return res.status(500).json({ error: `AI 연결 오류: ${data.error.message}` });
      }
  
      // 답변이 비어있는 경우 처리
      if (!data.candidates || data.candidates.length === 0) {
          return res.status(500).json({ error: "AI가 답변을 생성하지 못했습니다." });
      }
  
      // 6. 정상 답변 추출 및 반환
      const aiResponse = data.candidates[0].content.parts[0].text;
      res.status(200).json({ reply: aiResponse });
  
    } catch (error) {
      console.error("Server Internal Error:", error);
      res.status(500).json({ error: "서버 내부 오류가 발생했습니다." });
    }
  }
