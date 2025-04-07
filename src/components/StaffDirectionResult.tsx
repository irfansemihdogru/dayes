
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
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isSpeakingRef = useRef(false);
  const initialSpeechDoneRef = useRef(false);

  useEffect(() => {
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
      window.speechSynthesis.cancel();
    };
  }, [onTimeout]);

  useEffect(() => {
    if (!initialSpeechDoneRef.current) {
      initialSpeechDoneRef.current = true;

      // Ensure narration starts properly on page load
      setTimeout(() => {
        // First announcement - short summary
        speakText(`${staffName}, işlem: ${reason}, oda: ${staffRoomInfo.roomNumber}`);
        
        // Full detailed announcement after a short delay
        setTimeout(() => {
          const fullAnnouncement = `${staffName} personeline yönlendiriliyorsunuz. İşlem: ${reason}. Konum: ${staffRoomInfo.floor}. kat, ${staffRoomInfo.location} tarafta, ${staffRoomInfo.roomNumber} numaralı oda.`;
          speakText(fullAnnouncement);
        }, 2500);
      }, 500);
    }
  }, [staffName, staffRoomInfo, reason]);

  const speakText = (text: string) => {
    if (!audioEnabled || !('speechSynthesis' in window)) return;

    // Cancel any previous speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'tr-TR'; // Force Turkish language
    utterance.rate = 0.95;    // Slightly slower rate for better comprehension
    utterance.pitch = 1;
    utterance.volume = 1;     // Maximum volume

    // Get available voices and try to find Turkish voice
    const voices = window.speechSynthesis.getVoices();
    const turkishVoice = voices.find(voice => 
      voice.lang.includes('tr') || voice.name.includes('Turkish') || voice.name.includes('Türk')
    );
    
    // Use Turkish voice if available
    if (turkishVoice) {
      utterance.voice = turkishVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      isSpeakingRef.current = true;
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      isSpeakingRef.current = false;
    };

    window.speechSynthesis.speak(utterance);
  };

  const toggleAudio = () => {
    if (audioEnabled) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      // When re-enabling audio, speak the full detailed announcement
      const fullAnnouncement = `${staffName} personeline yönlendiriliyorsunuz. İşlem: ${reason}. Konum: ${staffRoomInfo.floor}. kat, ${staffRoomInfo.location} tarafta, ${staffRoomInfo.roomNumber} numaralı oda.`;
      speakText(fullAnnouncement);
    }
    setAudioEnabled(!audioEnabled);
  };

  return (
    <Card className="max-w-xl mx-auto shadow-md border p-6 bg-white dark:bg-gray-800 rounded-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold flex justify-center items-center">
          <MapPinIcon className="mr-2 text-blue-600 dark:text-blue-400" />
          <span className="flex-grow">Yönlendirme</span>
          <button 
            onClick={toggleAudio} 
            className="ml-auto text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={audioEnabled ? "Sesi kapat" : "Sesi aç"}
          >
            {audioEnabled ? <Volume2Icon /> : <VolumeXIcon />}
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center mb-4">
          <UserRoundIcon className="mx-auto text-blue-600 dark:text-blue-400" size={48} />
          <h2 className="text-xl font-semibold mt-2 text-gray-800 dark:text-gray-100">{staffName}</h2>
          <p className="text-gray-500 dark:text-gray-400">Personeline yönlendiriliyorsunuz</p>
        </div>

        <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded mb-4">
          <p className="font-medium text-blue-800 dark:text-blue-300">İşlem:</p>
          <p className="text-gray-700 dark:text-gray-200">{reason}</p>
        </div>

        <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded mb-4">
          <p className="font-medium text-green-800 dark:text-green-300">Konum:</p>
          <p className="text-gray-700 dark:text-gray-200">{staffRoomInfo.floor}. Kat, {staffRoomInfo.location} tarafı, Oda {staffRoomInfo.roomNumber}</p>
        </div>

        <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded flex items-center justify-center">
          <Clock className="mr-2 text-yellow-800 dark:text-yellow-300" />
          <span className="text-gray-700 dark:text-gray-200">Bu ekran <strong>{secondsLeft}</strong> saniye sonra kapanacak.</span>
        </div>

        <div className="mt-4 flex justify-center">
          <button
            onClick={() => {
              const fullAnnouncement = `${staffName} personeline yönlendiriliyorsunuz. İşlem: ${reason}. Konum: ${staffRoomInfo.floor}. kat, ${staffRoomInfo.location} tarafta, ${staffRoomInfo.roomNumber} numaralı oda.`;
              speakText(fullAnnouncement);
            }}
            disabled={isSpeaking}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white px-4 py-2 rounded hover:shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            aria-label="Yönlendirmeyi tekrar oku"
          >
            <Volume2Icon className="inline-block mr-2" size={16} />
            Yönlendirmeyi Tekrar Oku
          </button>
        </div>

        {isSpeaking && (
          <div className="mt-3 text-blue-600 dark:text-blue-400 text-center animate-pulse" aria-live="polite">
            Sistem konuşuyor, lütfen bekleyin...
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StaffDirectionResult;
