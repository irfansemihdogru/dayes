
import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserRoundIcon, MapPinIcon, Volume2Icon, VolumeXIcon } from 'lucide-react';
import { Clock } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

interface StaffRoomInfo {
  name: string;
  floor: number;
  location: string;
  roomNumber: number;
}

interface StaffDirectionResultProps {
  staffName: string;
  staffRoomInfo: StaffRoomInfo;
  reason: string;
  onTimeout: () => void;
}

const StaffDirectionResult: React.FC<StaffDirectionResultProps> = ({ 
  staffName, 
  staffRoomInfo,
  reason,
  onTimeout 
}) => {
  const [secondsLeft, setSecondsLeft] = useState(30);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isSpeakingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const initialSpeechDoneRef = useRef(false);
  const { theme } = useTheme();
  
  useEffect(() => {
    // Set countdown timer
    const timer = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    countdownRef.current = timer;
    
    return () => {
      clearInterval(timer);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Make sure to stop speaking when component unmounts
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }
  }, [onTimeout]);

  // Initialize audio automatically when component mounts
  useEffect(() => {
    // Automatically speak the directions when component mounts
    if (!initialSpeechDoneRef.current) {
      initialSpeechDoneRef.current = true;
      // Short delay to ensure component is fully rendered
      setTimeout(() => {
        speakFullDescription();
      }, 300);
    }
  }, []);

  const getDirectionsDescription = (): string => {
    const { floor, location, roomNumber } = staffRoomInfo;
    return `${floor}. kat, ${location} tarafta, ${roomNumber} numaralı oda.`;
  };

  const getLocationDisplay = (): string => {
    const { floor, location, roomNumber } = staffRoomInfo;
    return `${floor}. Kat, ${location}, Oda ${roomNumber}`;
  };

  const speakFullDescription = () => {
    const fullText = `${staffName} personeline yönlendiriliyorsunuz. İşlem: ${reason}. Konum: ${getDirectionsDescription()}`;
    speakText(fullText);
  };

  const speakText = (text: string) => {
    // Use Web Speech API for text-to-speech
    if (!('speechSynthesis' in window) || !audioEnabled) return;
    
    // Cancel any previous speech
    window.speechSynthesis.cancel();
    
    // Indicate speaking has started
    isSpeakingRef.current = true;
    setIsSpeaking(true);
    
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = 'tr-TR';
    speech.rate = 0.9; // Slightly slower for better understanding
    speech.pitch = 1;
    speech.volume = 1;
    
    speech.onend = () => {
      isSpeakingRef.current = false;
      setIsSpeaking(false);
    };
    
    speech.onerror = () => {
      isSpeakingRef.current = false;
      setIsSpeaking(false);
    };
    
    // Fallback in case the speech events don't fire
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      if (isSpeakingRef.current) {
        isSpeakingRef.current = false;
        setIsSpeaking(false);
      }
    }, text.length * 70 + 2000); // Estimated duration + buffer
    
    window.speechSynthesis.speak(speech);
  };
  
  const toggleAudio = () => {
    if (audioEnabled) {
      window.speechSynthesis.cancel(); // Stop speaking if turning off
      isSpeakingRef.current = false;
      setIsSpeaking(false);
    } else {
      // Re-speak the information when turning back on
      speakFullDescription();
    }
    setAudioEnabled(!audioEnabled);
  };
  
  const getDetailedDirections = () => {
    const { floor, location, roomNumber } = staffRoomInfo;
    let floorText = '';
    
    if (floor === 1) {
      floorText = 'Giriş katında';
    } else {
      floorText = `${floor}. kata çıkmanız gerekiyor`;
    }
    
    return `${floorText}, ${location} tarafta ${roomNumber} numaralı odaya gidiniz.`;
  };
  
  return (
    <Card className="w-full max-w-3xl mx-auto bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg border-2 border-blue-200 dark:border-blue-800 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-800 dark:to-blue-700 text-white rounded-t-lg py-6 text-center">
        <CardTitle className="text-3xl flex items-center justify-center relative">
          <MapPinIcon size={28} className="mr-2 text-yellow-300" />
          Yönlendirme
          <button 
            onClick={toggleAudio}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
            aria-label={audioEnabled ? "Sesli okumayı kapat" : "Sesli okumayı aç"}
            disabled={isSpeaking}
          >
            {audioEnabled ? 
              <Volume2Icon size={20} className="text-white" /> : 
              <VolumeXIcon size={20} className="text-white" />
            }
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 text-center dark:text-gray-200">
        <div className="mb-6 relative flex justify-center">
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 flex items-center justify-center shadow-inner">
            <UserRoundIcon size={56} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-blue-600 dark:bg-blue-700 text-white px-3 py-1 rounded-full text-sm font-bold">
            Personel
          </div>
        </div>
        
        <h2 className="text-3xl font-bold text-blue-800 dark:text-blue-300 mb-2 mt-4">{staffName}</h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">Personeline yönlendiriliyorsunuz</p>
        
        <div className="p-5 bg-blue-50 dark:bg-blue-900/40 rounded-lg mb-5 shadow-sm border border-blue-100 dark:border-blue-800">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 font-medium">İşlem</p>
          <p className="text-xl font-medium text-blue-800 dark:text-blue-300">{reason}</p>
        </div>
        
        <div className="p-5 bg-green-50 dark:bg-green-900/30 rounded-lg mb-6 shadow-sm border border-green-100 dark:border-green-800">
          <div className="flex items-center justify-center mb-3">
            <MapPinIcon className="text-green-600 dark:text-green-500 mr-2" size={24} />
            <p className="text-xl font-medium text-green-800 dark:text-green-300">{getLocationDisplay()}</p>
          </div>
          <p className="text-md text-green-700 dark:text-green-400 bg-white/70 dark:bg-gray-800/70 p-3 rounded-md border border-green-200 dark:border-green-700">{getDetailedDirections()}</p>
        </div>
        
        <div className="flex items-center justify-center space-x-2 mt-6 text-center bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded-lg border border-yellow-100 dark:border-yellow-800">
          <Clock size={18} className="text-amber-600 dark:text-amber-500" />
          <p className="text-amber-700 dark:text-amber-400 font-medium">Bu ekran <span className="font-bold text-amber-800 dark:text-amber-300">{secondsLeft}</span> saniye sonra otomatik olarak kapanacaktır.</p>
        </div>
        
        <div className="mt-6 flex justify-center">
          <button 
            onClick={speakFullDescription}
            className="flex items-center px-6 py-3 bg-blue-600 dark:bg-blue-700 text-white rounded-full hover:bg-blue-700 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-md transition-all duration-200"
            aria-label="Yönlendirmeleri tekrar oku"
            disabled={isSpeaking}
          >
            <Volume2Icon size={20} className="mr-2" />
            Yönlendirmeleri Tekrar Oku
          </button>
        </div>
        
        {isSpeaking && (
          <div className="mt-4 text-center p-2 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 rounded-lg animate-pulse">
            <p>Sistem konuşuyor, lütfen bekleyiniz...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StaffDirectionResult;
