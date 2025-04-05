
import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import VoiceRecognition from './VoiceRecognition';
import { Volume2Icon } from 'lucide-react';

interface AttendanceFormProps {
  onSubmit: (name: string, grade: number) => void;
}

const AttendanceForm: React.FC<AttendanceFormProps> = ({ onSubmit }) => {
  const [name, setName] = useState('');
  const [grade, setGrade] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(true);
  const [stage, setStage] = useState<'name' | 'grade'>('name');
  const [isReading, setIsReading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Helper function to speak text
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    
    setIsReading(true);
    setIsListening(false);
    
    // Cancel any previous speech
    window.speechSynthesis.cancel();
    
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = 'tr-TR';
    speech.rate = 0.9;
    speech.pitch = 1;
    speech.volume = 1;
    
    speech.onend = () => {
      setIsReading(false);
      setIsListening(true);
    };
    
    // Fallback in case onend doesn't trigger
    const estimatedDuration = text.length * 70; // ~70ms per character in Turkish
    timeoutRef.current = setTimeout(() => {
      setIsReading(false);
      setIsListening(true);
    }, estimatedDuration + 500);
    
    window.speechSynthesis.speak(speech);
  };
  
  // Clean up timeouts when unmounting
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Make sure speech stops when component unmounts
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);
  
  // When component mounts, read instructions
  useEffect(() => {
    const initialMessage = "Lütfen öğrencinin adını ve soyadını söyleyin. Herhangi bir giriş kabul edilecektir.";
    speakText(initialMessage);
  }, []);
  
  const handleNameVoiceResult = (text: string) => {
    setIsListening(false);
    
    // Accept any input for name, even single letters
    if (text.trim()) {
      setName(text);
      
      // Move to grade selection after a short delay
      setTimeout(() => {
        setStage('grade');
        speakText("Lütfen öğrencinin sınıfını söyleyin. 9, 10, 11 veya 12 olarak belirtiniz.");
      }, 1000);
    } else {
      // If somehow we got empty input, restart listening
      setTimeout(() => {
        setIsListening(true);
      }, 1000);
    }
  };
  
  const handleGradeVoiceResult = (text: string) => {
    setIsListening(false);
    
    // Try to extract the grade from the spoken text
    const lowerText = text.toLowerCase();
    let detectedGrade: number | null = null;
    
    // More aggressive pattern matching for grade numbers
    if (lowerText.includes("9") || lowerText.includes("dokuz")) {
      detectedGrade = 9;
    } else if (lowerText.includes("10") || lowerText.includes("on")) {
      detectedGrade = 10;
    } else if (lowerText.includes("11") || lowerText.includes("on bir")) {
      detectedGrade = 11;
    } else if (lowerText.includes("12") || lowerText.includes("on iki")) {
      detectedGrade = 12;
    }
    
    if (detectedGrade) {
      setGrade(detectedGrade);
      
      // Submit the form after both name and grade are collected
      setTimeout(() => {
        speakText(`${name} isimli ${detectedGrade}. sınıf öğrencisinin devamsızlık bilgileri getiriliyor.`);
        setTimeout(() => {
          onSubmit(name, detectedGrade);
        }, 2500);
      }, 1000);
    } else {
      // If no grade is detected, default to grade 9 and continue
      setGrade(9);
      setTimeout(() => {
        speakText(`${name} isimli öğrenci için sınıf algılanamadı. 9. sınıf varsayılan olarak seçildi.`);
        setTimeout(() => {
          onSubmit(name, 9);
        }, 3500);
      }, 1000);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && grade) {
      onSubmit(name, grade);
    }
  };
  
  return (
    <Card className="w-full max-w-3xl mx-auto bg-white/90 backdrop-blur-sm shadow-lg">
      <CardHeader className="bg-blue-600 text-white rounded-t-lg text-center">
        <CardTitle className="text-2xl">Devamsızlık Bilgileri</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="name" className="text-lg mb-2 block">Öğrenci Adı Soyadı</Label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              className="mt-1 text-lg p-3 h-auto" 
              disabled={stage !== 'name'}
              aria-describedby="name-desc"
            />
            <p id="name-desc" className="text-sm text-blue-600 mt-1">
              * Sesli olarak veya yazarak girebilirsiniz
            </p>
          </div>
          
          {stage === 'grade' && (
            <div>
              <Label htmlFor="grade" className="text-lg mb-2 block">Öğrenci Sınıfı</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
                {[9, 10, 11, 12].map((g) => (
                  <Button
                    key={g}
                    type="button"
                    variant={grade === g ? "default" : "outline"}
                    className={`h-14 text-xl ${grade === g ? 'bg-blue-600' : 'border-blue-300'}`}
                    onClick={() => {
                      setGrade(g);
                      setTimeout(() => {
                        onSubmit(name, g);
                      }, 500);
                    }}
                    aria-pressed={grade === g}
                  >
                    {g}. Sınıf
                  </Button>
                ))}
              </div>
            </div>
          )}
          
          {name && grade && (
            <Button 
              type="submit" 
              className="w-full mt-6 py-6 text-lg bg-blue-600 hover:bg-blue-700"
              aria-label="Devamsızlık bilgilerini görüntüle"
            >
              Devamsızlık Bilgilerini Görüntüle
            </Button>
          )}
        </form>
        
        <div className="mt-8 flex flex-col items-center">
          <div className={`${isReading ? 'bg-blue-50 border border-blue-200' : ''} rounded-lg p-3 w-full`}>
            <VoiceRecognition 
              isListening={isListening && !isReading} 
              onResult={stage === 'name' ? handleNameVoiceResult : handleGradeVoiceResult}
              prompt={stage === 'name' 
                ? "Lütfen öğrencinin adını ve soyadını söyleyin..." 
                : "Lütfen öğrencinin sınıfını söyleyin..."
              }
            />
          </div>
          
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => speakText(stage === 'name' 
                ? "Lütfen öğrencinin adını ve soyadını söyleyin. Herhangi bir giriş kabul edilecektir." 
                : "Lütfen öğrencinin sınıfını söyleyin. 9, 10, 11 veya 12 olarak belirtiniz."
              )}
              className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200"
              aria-label="Talimatları tekrar dinle"
            >
              <Volume2Icon size={18} />
              Talimatları Tekrar Dinle
            </button>
          </div>
        </div>
        
        <div className="mt-6 text-center text-sm text-gray-600" aria-live="polite">
          <p>Ana ekrana dönmek için ESC tuşuna basabilirsiniz</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AttendanceForm;
