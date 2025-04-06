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

      setTimeout(() => {
        speakText(`${staffName}, işlem: ${reason}, oda: ${staffRoomInfo.roomNumber}`);
        setTimeout(() => {
          speakText(`${staffName} personeline yönlendiriliyorsunuz. İşlem: ${reason}. Konum: ${staffRoomInfo.floor}. kat, ${staffRoomInfo.location} tarafta, ${staffRoomInfo.roomNumber} numaralı oda.`);
        }, 2500);
      }, 500);
    }
  }, []);

  const speakText = (text: string) => {
    if (!audioEnabled || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'tr-TR';
    utterance.rate = 0.95;
    utterance.pitch = 1;

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
      speakText(`${staffName} personeline yönlendiriliyorsunuz. İşlem: ${reason}. Konum: ${staffRoomInfo.floor}. kat, ${staffRoomInfo.location} tarafta, ${staffRoomInfo.roomNumber} numaralı oda.`);
    }
    setAudioEnabled(!audioEnabled);
  };

  return (
    <Card className="max-w-xl mx-auto shadow-md border p-6 bg-white dark:bg-gray-800 rounded-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold flex justify-center items-center">
          <MapPinIcon className="mr-2" />
          Yönlendirme
          <button onClick={toggleAudio} className="ml-auto text-blue-600">
            {audioEnabled ? <Volume2Icon /> : <VolumeXIcon />}
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center mb-4">
          <UserRoundIcon className="mx-auto text-blue-600" size={48} />
          <h2 className="text-xl font-semibold mt-2">{staffName}</h2>
          <p className="text-gray-500">Personeline yönlendiriliyorsunuz</p>
        </div>

        <div className="bg-blue-100 p-4 rounded mb-4">
          <p className="font-medium">İşlem:</p>
          <p>{reason}</p>
        </div>

        <div className="bg-green-100 p-4 rounded mb-4">
          <p className="font-medium">Konum:</p>
          <p>{staffRoomInfo.floor}. Kat, {staffRoomInfo.location} tarafı, Oda {staffRoomInfo.roomNumber}</p>
        </div>

        <div className="bg-yellow-100 p-3 rounded flex items-center justify-center">
          <Clock className="mr-2" />
          <span>Bu ekran <strong>{secondsLeft}</strong> saniye sonra kapanacak.</span>
        </div>

        <div className="mt-4 flex justify-center">
          <button
            onClick={() =>
              speakText(`${staffName} personeline yönlendiriliyorsunuz. İşlem: ${reason}. Konum: ${staffRoomInfo.floor}. kat, ${staffRoomInfo.location} tarafta, ${staffRoomInfo.roomNumber} numaralı oda.`)
            }
            disabled={isSpeaking}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            <Volume2Icon className="inline-block mr-2" size={16} />
            Yönlendirmeyi Tekrar Oku
          </button>
        </div>

        {isSpeaking && (
          <div className="mt-3 text-blue-600 text-center animate-pulse">
            Sistem konuşuyor, lütfen bekleyin...
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StaffDirectionResult;
