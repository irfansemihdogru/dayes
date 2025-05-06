import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import VoiceRecognition from './VoiceRecognition';
import { Volume2Icon } from 'lucide-react';
import { speakText, isCurrentlySpeaking, cancelSpeech } from '@/utils/speechUtils';

interface AttendanceFormProps {
  onSubmit: (name: string, grade: number) => void;
}

const AttendanceForm: React.FC<AttendanceFormProps> = ({ onSubmit }) => {
  const [name, setName] = useState('');
  const [grade, setGrade] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [stage, setStage] = useState<'name' | 'grade'>('name');
  const [isReading, setIsReading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSpeakingRef = useRef(false);
  const systemLastSpokeRef = useRef<number>(Date.now());
  const bufferTimeAfterSpeechMs = 800; // Reduced buffer time for better responsiveness
  
  // Clean up timeouts when unmounting
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Make sure speech stops when component unmounts
      cancelSpeech();
    };
  }, []);
  
  // When component mounts, read instructions
  useEffect(() => {
    // Add a small delay before initial prompt to ensure component is fully mounted
    setTimeout(() => {
      const initialMessage = "Lütfen öğrencinin adını ve soyadını söyleyin.";
      speakPrompt(initialMessage);
    }, 300);
  }, []);
  
  // Helper function to speak text and manage listening state
  const speakPrompt = (text: string) => {
    setIsReading(true);
    setIsListening(false);
    
    // Cancel any ongoing speech
    cancelSpeech();
    
    speakText(text, {
      rate: 0.9,
      onStart: () => {
        isSpeakingRef.current = true;
        setIsReading(true);
        // Store the timestamp when system starts speaking
        systemLastSpokeRef.current = Date.now();
      },
      onEnd: () => {
        isSpeakingRef.current = false;
        setIsReading(false);
        
        // Update the timestamp when system stops speaking
        systemLastSpokeRef.current = Date.now();
        
        // Add a buffer before enabling microphone to prevent self-triggering
        setTimeout(() => {
          setIsListening(true);
        }, bufferTimeAfterSpeechMs);
      }
    });
    
    // Safety timeout in case onEnd doesn't trigger
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    const estimatedDuration = text.length * 80; // Allow more time per character
    timeoutRef.current = setTimeout(() => {
      if (isSpeakingRef.current) {
        isSpeakingRef.current = false;
        setIsReading(false);
        
        // Update the timestamp when system stops speaking
        systemLastSpokeRef.current = Date.now();
        
        // Add buffer time before enabling microphone
        setTimeout(() => {
          setIsListening(true);
        }, bufferTimeAfterSpeechMs);
      }
    }, estimatedDuration + 2000); // Increased safety margin
  };
  
  const handleNameVoiceResult = (text: string) => {
    // Ignore inputs that come too soon after system speech (probably self-triggered)
    const timeSinceSystemSpoke = Date.now() - systemLastSpokeRef.current;
    if (timeSinceSystemSpoke < bufferTimeAfterSpeechMs) {
      console.log(`Ignoring voice input that came too soon (${timeSinceSystemSpoke}ms) after system speech`);
      return;
    }
    
    // Accept any input for name as long as it's not empty
    if (text.trim()) {
      setName(text);
      setIsListening(false); // Immediately stop listening
      
      // Move to grade selection after a short delay
      setTimeout(() => {
        setStage('grade');
        speakPrompt("Öğrencinin sınıfını söyleyin.");
      }, 300); // Reduced delay for better responsiveness
    } else {
      // If somehow we got empty input, restart listening
      setTimeout(() => {
        setIsListening(true);
      }, 300);
    }
  };
  
  const handleGradeVoiceResult = (text: string) => {
    // Ignore inputs that come too soon after system speech (probably self-triggered)
    const timeSinceSystemSpoke = Date.now() - systemLastSpokeRef.current;
    if (timeSinceSystemSpoke < bufferTimeAfterSpeechMs) {
      console.log(`Ignoring voice input that came too soon (${timeSinceSystemSpoke}ms) after system speech`);
      return;
    }
    
    setIsListening(false); // Immediately stop listening
    
    // Try to extract the grade from the spoken text
    const lowerText = text.toLowerCase();
    // Default to 9th grade if no grade is detected
    let detectedGrade: number = 9;
    
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
    
    setGrade(detectedGrade);
    
    // Always proceed immediately with whatever grade we detected
    speakText(`${detectedGrade}. sınıf seçildi. Devamsızlık bilgileri getiriliyor.`, {
      onStart: () => {
        // Update the timestamp when system starts speaking
        systemLastSpokeRef.current = Date.now();
      },
      onEnd: () => {
        // Update the timestamp when system stops speaking
        systemLastSpokeRef.current = Date.now();
        
        // Submit after speech has finished
        setTimeout(() => {
          onSubmit(name, detectedGrade);
        }, 300); // Reduced delay for better responsiveness
      }
    });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name) {
      // Default to grade 9 if none selected
      const selectedGrade = grade || 9;
      onSubmit(name, selectedGrade);
    }
  };

  const handleGradeButtonClick = (selectedGrade: number) => {
    setGrade(selectedGrade);
    setIsListening(false); // Stop listening when grade is selected
    
    // Submit the form immediately after selecting grade
    speakText(`${selectedGrade}. sınıf seçildi. Devamsızlık bilgileri getiriliyor.`, {
      onStart: () => {
        // Update the timestamp when system starts speaking
        systemLastSpokeRef.current = Date.now();
      },
      onEnd: () => {
        // Update the timestamp when system stops speaking
        systemLastSpokeRef.current = Date.now();
        
        setTimeout(() => {
          onSubmit(name, selectedGrade);
        }, 300); // Reduced delay for better responsiveness
      }
    });
  };
  
  // Props to pass to VoiceRecognition component
  const getVoiceRecognitionProps = () => {
    return {
      isListening,
      onResult: stage === 'name' ? handleNameVoiceResult : handleGradeVoiceResult,
      onListeningEnd: () => console.log("Listening ended"),
      prompt: stage === 'name' 
        ? "Lütfen öğrencinin adını ve soyadını söyleyin..." 
        : "Öğrencinin sınıfını söyleyin...",
      systemLastSpokeTimestamp: systemLastSpokeRef.current,
      bufferTimeMs: bufferTimeAfterSpeechMs
    };
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
            <div className="flex flex-col items-center">
              <Label htmlFor="grade" className="text-lg mb-2 block">Öğrenci Sınıfı</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1 w-full">
                {[9, 10, 11, 12].map((g) => (
                  <Button
                    key={g}
                    type="button"
                    variant={grade === g ? "default" : "outline"}
                    className={`h-14 text-xl ${grade === g ? 'bg-blue-600' : 'border-blue-300'}`}
                    onClick={() => handleGradeButtonClick(g)}
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
              {...getVoiceRecognitionProps()}
            />
            {isReading && (
              <div className="mt-2 text-center p-2 bg-blue-100 text-blue-800 rounded-lg animate-pulse">
                <p>Sistem konuşuyor, lütfen bekleyiniz...</p>
              </div>
            )}
          </div>
          
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => speakPrompt(stage === 'name' 
                ? "Lütfen öğrencinin adını ve soyadını söyleyin." 
                : "Öğrencinin sınıfını söyleyin."
              )}
              className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200"
              aria-label="Talimatları tekrar dinle"
              disabled={isCurrentlySpeaking()}
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
