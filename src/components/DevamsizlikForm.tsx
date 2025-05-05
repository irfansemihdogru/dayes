
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTheme } from '@/context/ThemeContext';
import { speakText } from '@/utils/speechUtils';
import VoiceRecognition from './VoiceRecognition';
import { cancelSpeech } from '@/utils/speechUtils';

interface DevamsizlikFormProps {
  onSubmit: (name: string, surname: string) => void;
}

const DevamsizlikForm: React.FC<DevamsizlikFormProps> = ({ onSubmit }) => {
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const { isDarkMode } = useTheme();
  const [isListening, setIsListening] = useState(false);
  const [processingVoice, setProcessingVoice] = useState(false);
  const [speakingComplete, setSpeakingComplete] = useState(false);
  
  useEffect(() => {
    // Start voice recognition after a short delay
    const timer = setTimeout(() => {
      // Announce the prompt for name and surname input
      speakText('Lütfen öğrencinin adını ve soyadını söyleyiniz', {
        onStart: () => {
          setSpeakingComplete(false);
        },
        onEnd: () => {
          setSpeakingComplete(true);
          setTimeout(() => {
            setIsListening(true);
          }, 300);
        }
      });
    }, 500);
    
    return () => {
      clearTimeout(timer);
      cancelSpeech();
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (name.trim() && surname.trim()) {
      setIsListening(false); // Stop listening
      speakText(`${name} ${surname} öğrencisinin devamsızlık bilgileri getiriliyor`, {
        onEnd: () => onSubmit(name, surname)
      });
    }
  };
  
  // Helper function to normalize Turkish characters
  const normalizeTurkishText = (text: string): string => {
    // Replace common misspellings of Turkish characters
    return text
      .replace(/ı/g, 'ı')
      .replace(/i̇/g, 'i')
      .replace(/İ/g, 'İ')
      .replace(/ü/g, 'ü')
      .replace(/ğ/g, 'ğ')
      .replace(/ö/g, 'ö')
      .replace(/ş/g, 'ş')
      .replace(/ç/g, 'ç');
  };
  
  const handleVoiceResult = (text: string) => {
    setProcessingVoice(true);
    console.log("Voice recognition result:", text);
    
    // Clean the text: remove punctuation and normalize for Turkish characters
    const cleanedText = normalizeTurkishText(
      text
        .replace(/[.,!?;:'"()[\]{}]/g, '') // Remove punctuation
        .trim()
    );
    
    console.log("Cleaned text:", cleanedText);
    
    // Process the voice input to extract name and surname
    const nameParts = cleanedText.split(/\s+/);
    
    if (nameParts.length >= 2) {
      // Assume last word is surname, everything before is first name(s)
      const surname = nameParts.pop() || '';
      const firstName = nameParts.join(' ');
      
      setName(firstName);
      setSurname(surname);
      
      // Stop listening after successful recognition
      setIsListening(false);
      
      // Provide feedback and submit after short delay
      setTimeout(() => {
        speakText(`${firstName} ${surname} öğrencisinin devamsızlık bilgileri getiriliyor`, {
          onEnd: () => {
            setProcessingVoice(false);
            onSubmit(firstName, surname);
          }
        });
      }, 500);
    } else {
      // If input doesn't have at least two words, provide feedback
      speakText('Lütfen öğrencinin adını ve soyadını tam olarak söyleyiniz', {
        onEnd: () => {
          setProcessingVoice(false);
          setIsListening(true); // Resume listening
        }
      });
    }
  };

  
  return (
    <Card className={`w-full mx-auto max-w-2xl ${isDarkMode ? 'bg-gray-800/90 dark:border-gray-700' : 'bg-white/90'} backdrop-blur-sm shadow-lg`}>
      <CardHeader className={`${isDarkMode ? 'bg-blue-800 border-blue-700' : 'bg-blue-600'} text-white rounded-t-lg`}>
        <CardTitle className="text-2xl text-center">Devamsızlık Bilgileri Sorgulama</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className={`${isDarkMode ? 'text-gray-200' : 'text-gray-700'} text-lg`}>Öğrenci Adı</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} focus:ring-blue-500 focus:border-blue-500 text-lg py-6`}
                placeholder="Adı giriniz"
                required
                aria-label="Öğrenci adını giriniz"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="surname" className={`${isDarkMode ? 'text-gray-200' : 'text-gray-700'} text-lg`}>Öğrenci Soyadı</Label>
              <Input
                id="surname"
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
                className={`${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} focus:ring-blue-500 focus:border-blue-500 text-lg py-6`}
                placeholder="Soyadı giriniz"
                required
                aria-label="Öğrenci soyadını giriniz"
              />
            </div>
          </div>
          <CardFooter className="px-0 pt-6 flex justify-end">
            <Button 
              type="submit"
              className={`${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'} text-white text-lg py-6 px-8`}
              disabled={!name.trim() || !surname.trim()}
              aria-label="Devamsızlık bilgilerini sorgula"
            >
              Sorgula
            </Button>
          </CardFooter>
        </form>
        
        {/* Voice Recognition Section */}
        <div className="mt-6 border-t pt-4 border-gray-200 dark:border-gray-700">
          <p className={`mb-3 text-center ${isDarkMode ? 'text-blue-300' : 'text-blue-700'} text-lg`}>
            Öğrenci adını ve soyadını sesli olarak söyleyebilirsiniz
          </p>
          <VoiceRecognition
            isListening={isListening && speakingComplete}
            onResult={handleVoiceResult}
            onListeningEnd={() => setIsListening(false)}
            prompt="Lütfen öğrencinin adını ve soyadını söyleyiniz"
          />
          
          {processingVoice && (
            <div className="mt-3 text-center">
              <p className="text-green-600 dark:text-green-400 animate-pulse text-lg">
                İşleniyor...
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DevamsizlikForm;
