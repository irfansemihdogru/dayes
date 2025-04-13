
export const GEMINI_API_KEY = 'AIzaSyBmfqWbslCpP0Yoj_n0hxVsUiuOybwiZ_Q';

export interface GeminiResponse {
  text: string;
  intent?: string;
  confidence?: number;
  grade?: string;
}

export async function processVoiceCommand(text: string): Promise<GeminiResponse> {
  // First try to detect grades directly through pattern matching
  // This is faster than API calls and more reliable for numbers
  const gradePatterns = [
    { regex: /\b9\b|dokuz|dokuzuncu|dokuzuncu sınıf/i, grade: "9" },
    { regex: /\b10\b|on|onuncu|onuncu sınıf/i, grade: "10" },
    { regex: /\b11\b|on\s*bir|on\s*birinci|on\s*birinci sınıf/i, grade: "11" },
    { regex: /\b12\b|on\s*iki|on\s*ikinci|on\s*ikinci sınıf/i, grade: "12" }
  ];
  
  // Check text for grade patterns
  for (const pattern of gradePatterns) {
    if (pattern.regex.test(text.toLowerCase())) {
      console.log(`Direct grade match found: ${pattern.grade}`);
      return {
        text: `${pattern.grade}. sınıf`,
        grade: pattern.grade,
        confidence: 0.95,
        intent: "sinif-secimi"
      };
    }
  }
  
  // If no direct grade match, check for intent patterns
  const intentPatterns = [
    { regex: /mesem|mes\.?em/i, intent: "mesem" },
    { regex: /usta\s*öğretici|usta\s*ogretici|usta\s*öğreticilik/i, intent: "usta-ogreticilik-belgesi" },
    { regex: /diploma/i, intent: "diploma" },
    { regex: /disiplin/i, intent: "disiplin" },
    { regex: /öğrenci\s*alma\s*izni|ogrenci\s*alma\s*izni|çocuk\s*alma\s*izni|cocuk\s*alma\s*izni/i, intent: "ogrenci-alma-izni" },
    { regex: /kayıt|kayit|9.?sınıf\s*kayıt|9.?sinif\s*kayit/i, intent: "9-sinif-kayit" },
  ];
  
  // Check text for direct intent matches
  for (const pattern of intentPatterns) {
    if (pattern.regex.test(text.toLowerCase())) {
      console.log(`Direct intent match found: ${pattern.intent}`);
      return {
        text: text,
        intent: pattern.intent,
        confidence: 0.9
      };
    }
  }

  try {
    const prompt = `
      Aşağıdaki ses komutunu analiz et ve kullanıcının ne yapmak istediğini belirle. 
      Olası işlemler: mesem, usta-ogreticilik-belgesi, diploma, disiplin, ogrenci-alma-izni, 9-sinif-kayit.
      Kullanıcı sınıf belirtiyorsa (9, 10, 11, 12) bunu da belirle.
      
      Özellikle sınıf seçimlerine dikkat et. Eğer kullanıcı "9", "10", "11", "12" veya "dokuz", "on", "on bir", "on iki" gibi ifadeler kullanıyorsa, bunun bir sınıf seçimi olduğunu belirle.
      
      JSON formatında yanıt ver, örnek: 
      {
        "text": "Cevabın burada olacak",
        "intent": "mesem|usta-ogreticilik-belgesi|diploma|disiplin|ogrenci-alma-izni|9-sinif-kayit|sinif-secimi",
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
        console.log("Gemini processed result:", jsonResponse);
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
