
import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserRoundIcon, MapPinIcon, Volume2Icon, Volume1Icon, VolumeXIcon } from 'lucide-react';
import { getRandomRoomLocation, getDirectionsDescription } from '@/utils/locationUtils';

interface StaffDirectionResultProps {
  staffName: string;
  reason: string;
  onTimeout: () => void;
}

const StaffDirectionResult: React.FC<StaffDirectionResultProps> = ({ 
  staffName, 
  reason,
  onTimeout 
}) => {
  const [location, setLocation] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(30);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    // Generate random location when component mounts
    const generatedLocation = getRandomRoomLocation();
    setLocation(generatedLocation);
    
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
    
    return () => clearInterval(timer);
  }, [onTimeout]);

  useEffect(() => {
    // Initialize audio context for screen reader announcement
    if (location && audioEnabled) {
      speakText(`${staffName} personeline yönlendiriliyorsunuz. İşlem: ${reason}. Konum: ${getDirectionsDescription(location)}`);
    }
  }, [location, staffName, reason, audioEnabled]);

  const speakText = (text: string) => {
    // Use Web Speech API for text-to-speech
    if (!('speechSynthesis' in window)) return;
    
    // Cancel any previous speech
    window.speechSynthesis.cancel();
    
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = 'tr-TR';
    speech.rate = 0.9; // Slightly slower for better understanding
    speech.pitch = 1;
    speech.volume = 1;
    
    window.speechSynthesis.speak(speech);
  };
  
  const toggleAudio = () => {
    if (audioEnabled) {
      window.speechSynthesis.cancel(); // Stop speaking if turning off
    } else {
      // Re-speak the information when turning back on
      speakText(`${staffName} personeline yönlendiriliyorsunuz. İşlem: ${reason}. Konum: ${getDirectionsDescription(location)}`);
    }
    setAudioEnabled(!audioEnabled);
  };
  
  return (
    <Card className="w-full max-w-3xl bg-white/90 backdrop-blur-sm shadow-lg">
      <CardHeader className="bg-blue-600 text-white rounded-t-lg">
        <CardTitle className="text-2xl text-center relative">
          Yönlendirme
          <button 
            onClick={toggleAudio}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 focus:outline-none"
            aria-label={audioEnabled ? "Sesli okumayı kapat" : "Sesli okumayı aç"}
          >
            {audioEnabled ? 
              <Volume2Icon size={20} className="text-white" /> : 
              <VolumeXIcon size={20} className="text-white" />
            }
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 text-center">
        <div className="mb-6">
          <div className="w-24 h-24 rounded-full bg-blue-100 mx-auto flex items-center justify-center">
            <UserRoundIcon size={48} className="text-blue-600" />
          </div>
        </div>
        
        <h2 className="text-3xl font-bold text-blue-800 mb-2">{staffName}</h2>
        <p className="text-lg text-gray-600 mb-6">Personeline yönlendiriliyorsunuz</p>
        
        <div className="p-4 bg-blue-50 rounded-lg mb-4">
          <p className="text-sm text-gray-600 mb-1">İşlem</p>
          <p className="text-xl font-medium text-blue-800">{reason}</p>
        </div>
        
        <div className="p-4 bg-green-50 rounded-lg mb-6 flex items-center justify-center">
          <MapPinIcon className="text-green-600 mr-2" size={24} />
          <p className="text-xl font-medium text-green-800">{location}</p>
        </div>
        
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Bu ekran {secondsLeft} saniye sonra otomatik olarak kapanacaktır.</p>
        </div>
        
        <button 
          onClick={() => speakText(getDirectionsDescription(location))}
          className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="Yönlendirmeleri tekrar oku"
        >
          <Volume1Icon size={18} className="mr-2" />
          Yönlendirmeleri Sesli Dinle
        </button>
      </CardContent>
    </Card>
  );
};

export default StaffDirectionResult;
