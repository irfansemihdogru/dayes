
export const GEMINI_API_KEY = 'AIzaSyBmfqWbslCpP0Yoj_n0hxVsUiuOybwiZ_Q';

export interface GeminiResponse {
  text: string;
  intent?: string;
  confidence?: number;
  grade?: string;
}

export async function processVoiceCommand(text: string): Promise<GeminiResponse> {
  try {
    // Optimized prompt for better response to grade selections
    const prompt = `
      Ses komutunu analiz et ve kullanıcının ne istediğini belirle. 
      Olası işlemler: mesem, usta-ogreticilik-belgesi, diploma, disiplin, ogrenci-alma-izni, 9-sinif-kayit, devamsizlik.
      Sınıf seçimleri: 9, 10, 11, 12.
      
      ÖNEMLI: "9. sınıf", "10. sınıf", "11. sınıf", "12. sınıf" gibi ifadeler olunca SADECE "sinif-secimi" intent'i ve ilgili sınıf değeri olarak ayarla. Örneğin "11. sınıf" derse, intent="sinif-secimi" ve grade="11" olmalı.
      
      JSON formatında kısa ve net yanıt ver: 
      {
        "text": "Kısa açıklama",
        "intent": "mesem|usta-ogreticilik-belgesi|diploma|disiplin|ogrenci-alma-izni|9-sinif-kayit|devamsizlik|sinif-secimi",
        "grade": "9|10|11|12", (sınıf seçimi yapıldıysa)
        "confidence": 0.1-0.9 arası değer
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
    
    try {
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      // Find JSON in the response text
      const jsonMatch = responseText.match(/{[\s\S]*}/);
      
      if (jsonMatch) {
        const jsonResponse = JSON.parse(jsonMatch[0]);
        // Enhanced recognition for grade selections
        if (jsonResponse.intent === 'sinif-secimi' && jsonResponse.grade) {
          console.log('Grade selection detected:', jsonResponse.grade);
        }
        
        return {
          text: jsonResponse.text || '',
          intent: jsonResponse.intent || '',
          confidence: jsonResponse.confidence || 0,
          grade: jsonResponse.grade
        };
      }
      
      // Improved fallback if no JSON found
      return {
        text: 'Komut anlaşılmadı.',
        intent: 'unknown',
        confidence: 0
      };
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
      return {
        text: 'Anlayamadım.',
        intent: 'unknown',
        confidence: 0
      };
    }
  } catch (error) {
    console.error('Gemini API error:', error);
    return {
      text: 'Ses tanımada hata oluştu.',
      intent: 'error',
      confidence: 0
    };
  }
}
