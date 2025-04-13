
export const GEMINI_API_KEY = 'AIzaSyBmfqWbslCpP0Yoj_n0hxVsUiuOybwiZ_Q';

export interface GeminiResponse {
  text: string;
  intent?: string;
  confidence?: number;
  grade?: string;
}

export async function processVoiceCommand(text: string): Promise<GeminiResponse> {
  try {
    const prompt = `
      Aşağıdaki ses komutunu analiz et ve kullanıcının ne yapmak istediğini belirle. 
      Olası işlemler: mesem, usta-ogreticilik-belgesi, diploma, disiplin, ogrenci-alma-izni, 9-sinif-kayit, devamsizlik.
      Kullanıcı sınıf belirtiyorsa (9, 10, 11, 12) bunu da belirle.
      
      JSON formatında yanıt ver, örnek: 
      {
        "text": "Cevabın burada olacak",
        "intent": "mesem|usta-ogreticilik-belgesi|diploma|disiplin|ogrenci-alma-izni|9-sinif-kayit|devamsizlik|sinif-secimi",
        "grade": "9|10|11|12", (eğer sınıf seçimi yapıldıysa)
        "confidence": 0.9
      }
      
      Kullanıcı girdisi: "${text}"
    `;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract the JSON response from the text
    try {
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      // Find JSON in the response text
      const jsonMatch = responseText.match(/{[\s\S]*}/);
      
      if (jsonMatch) {
        const jsonResponse = JSON.parse(jsonMatch[0]);
        return {
          text: jsonResponse.text || '',
          intent: jsonResponse.intent || '',
          confidence: jsonResponse.confidence || 0,
          grade: jsonResponse.grade
        };
      }
      
      // Fallback if no JSON found
      return {
        text: responseText,
        intent: 'unknown',
        confidence: 0
      };
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
      return {
        text: 'Yanıtınızı anlamakta zorluk çekiyorum. Lütfen tekrar söyler misiniz?',
        intent: 'unknown',
        confidence: 0
      };
    }
  } catch (error) {
    console.error('Gemini API error:', error);
    return {
      text: 'Üzgünüm, sesli komutunuzu işlemede bir hata oluştu.',
      intent: 'error',
      confidence: 0
    };
  }
}
