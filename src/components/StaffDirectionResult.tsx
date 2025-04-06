import React, { useEffect, useState, useRef } from 'react';
import { Volume2Icon, VolumeXIcon } from 'lucide-react';

interface StaffTTSProps {
  staffName: string;
  reason: string;
  room: {
    floor: number;
    location: string;
    roomNumber: number;
  };
}

const StaffTTS: React.FC<StaffTTSProps> = ({ staffName, reason, room }) => {
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isSpeakingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialSpeechDoneRef = useRef(false);

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window) || !audioEnabled) return;

    window.speechSynthesis.cancel();
    isSpeakingRef.current = true;
    setIsSpeaking(true);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'tr-TR';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onend = () => {
      isSpeakingRef.current = false;
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      isSpeakingRef.current = false;
      setIsSpeaking(false);
    };

    // Fallback timeout
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      isSpeakingRef.current = false;
      setIsSpeaking(false);
    }, text.length * 70 + 2000);

    window.speechSynthesis.speak(utterance);
  };

  const speakDescription = () => {
    const { floor, location, roomNumber } = room;
    const description = `${staffName} personeline yönlendiriliyorsunuz. İşlem: ${reason}. Oda bilgisi: ${floor}. kat, ${location} tarafı, ${roomNumber} numaralı oda.`;
    speakText(description);
  };

  const toggleAudio = () => {
    if (audioEnabled) {
      window.speechSynthesis.cancel();
      isSpeakingRef.current = false;
      setIsSpeaking(false);
    } else {
      speakDescription();
    }
    setAudioEnabled(!audioEnabled);
  };

  useEffect(() => {
    if (!initialSpeechDoneRef.current) {
      initialSpeechDoneRef.current = true;
      setTimeout(() => {
        speakDescription();
      }, 500);
    }

    return () => {
      window.speechSynthesis.cancel();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div className="text-center p-6 rounded-lg bg-white dark:bg-gray-800 shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-blue-600 dark:text-blue-300">{staffName}</h2>
      <p className="mb-2">İşlem: <strong>{reason}</strong></p>
      <p className="mb-4">Oda: <strong>{room.floor}. Kat, {room.location}, {room.roomNumber} No</strong></p>

      <div className="flex justify-center gap-4 mt-4">
        <button 
          onClick={speakDescription}
          disabled={isSpeaking}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-full flex items-center"
        >
          <Volume2Icon className="mr-2" size={20} />
          Tekrar Oku
        </button>
        <button 
          onClick={toggleAudio}
          className="bg-gray-300 dark:bg-gray-700 text-black dark:text-white py-2 px-4 rounded-full"
        >
          {audioEnabled ? <VolumeXIcon size={20} /> : <Volume2Icon size={20} />}
        </button>
      </div>

      {isSpeaking && (
        <p className="mt-4 text-sm text-blue-600 dark:text-blue-300 animate-pulse">Sesli okuma yapılıyor...</p>
      )}
    </div>
  );
};

export default StaffTTS;
