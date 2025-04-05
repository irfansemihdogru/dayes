
import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserRoundIcon, MapPinIcon, Volume2Icon, VolumeXIcon, Clock } from 'lucide-react';

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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isSpeakingRef = useRef(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
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
    
    return () => {
      clearInterval(timer);
      // Make sure to stop speaking when component unmounts
      window.speechSynthesis.cancel();
    }
  }, [onTimeout]);

  useEffect(() => {
    // Initialize audio context for screen reader announcement
    if (staffRoomInfo && audioEnabled) {
      speakText(`${staffName} personeline yönlendiriliyorsunuz. İşlem: ${reason}. Konum: ${getDirectionsDescription()}`);
    }
  }, [staffName, reason, staffRoomInfo, audioEnabled]);

  const getDirectionsDescription = (): string => {
    const { floor, location, roomNumber } = staffRoomInfo;
    return `${floor}. kat, ${location} tarafta, ${roomNumber} numaralı oda.`;
  };

  const getLocationDisplay = (): string => {
    const { floor, location, roomNumber } = staffRoomInfo;
    return `${floor}. Kat, ${location}, Oda ${roomNumber}`;
  };

  const speakText = (text: string) => {
    // Use Web Speech API for text-to-speech
    if (!('speechSynthesis' in window)) return;
    
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
    setTimeout(() => {
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
      speakText(`${staffName} personeline yönlendiriliyorsunuz. İşlem: ${reason}. Konum: ${getDirectionsDescription()}`);
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
    <Card className="w-full max-w-3xl mx-auto bg-white/90 backdrop-blur-sm shadow-lg border-2 border-blue-200 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-t-lg py-6 text-center">
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
      <CardContent className="p-6 text-center">
        <div className="mb-6 relative flex justify-center">
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center shadow-inner">
            <UserRoundIcon size={56} className="text-blue-600" />
          </div>
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">
            Personel
          </div>
        </div>
        
        <h2 className="text-3xl font-bold text-blue-800 mb-2 mt-4">{staffName}</h2>
        <p className="text-lg text-gray-600 mb-6">Personeline yönlendiriliyorsunuz</p>
        
        <div className="p-5 bg-blue-50 rounded-lg mb-5 shadow-sm border border-blue-100">
          <p className="text-sm text-gray-600 mb-1 font-medium">İşlem</p>
          <p className="text-xl font-medium text-blue-800">{reason}</p>
        </div>
        
        <div className="p-5 bg-green-50 rounded-lg mb-6 shadow-sm border border-green-100">
          <div className="flex items-center justify-center mb-3">
            <MapPinIcon className="text-green-600 mr-2" size={24} />
            <p className="text-xl font-medium text-green-800">{getLocationDisplay()}</p>
          </div>
          <p className="text-md text-green-700 bg-white/70 p-3 rounded-md border border-green-200">{getDetailedDirections()}</p>
        </div>
        
        <div className="flex items-center justify-center space-x-2 mt-6 text-center bg-yellow-50 p-3 rounded-lg border border-yellow-100">
          <Clock size={18} className="text-amber-600" />
          <p className="text-amber-700 font-medium">Bu ekran <span className="font-bold text-amber-800">{secondsLeft}</span> saniye sonra otomatik olarak kapanacaktır.</p>
        </div>
        
        <div className="mt-6 flex justify-center">
          <button 
            onClick={() => speakText(getDetailedDirections())}
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-md transition-all duration-200"
            aria-label="Yönlendirmeleri tekrar oku"
            disabled={isSpeaking}
          >
            <Volume2Icon size={20} className="mr-2" />
            Yönlendirmeleri Sesli Dinle
          </button>
        </div>
        
        {isSpeaking && (
          <div className="mt-4 text-center p-2 bg-blue-100 text-blue-800 rounded-lg animate-pulse">
            <p>Sistem konuşuyor, lütfen bekleyiniz...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StaffDirectionResult;
