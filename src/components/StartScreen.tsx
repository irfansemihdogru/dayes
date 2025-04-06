
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Volume2Icon, Play } from 'lucide-react';

interface StartScreenProps {
  onStart: () => void;
  audioEnabled: boolean;
  toggleAudio: () => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart, audioEnabled, toggleAudio }) => {
  // Function to speak welcome text
  const speakWelcome = () => {
    if (!('speechSynthesis' in window) || !audioEnabled) return;
    
    const welcomeText = "Yıldırım Mesleki ve Teknik Anadolu Lisesi Veli Yönlendirme Sistemine hoş geldiniz.";
    const speech = new SpeechSynthesisUtterance(welcomeText);
    speech.lang = 'tr-TR';
    speech.rate = 0.9;
    speech.pitch = 1;
    
    window.speechSynthesis.speak(speech);
  };
  
  return (
    <div className="h-screen w-full flex items-center justify-center bg-gradient-to-b from-blue-100 to-white p-4">
      <Card className="w-full max-w-4xl bg-white/90 backdrop-blur-md shadow-xl border border-blue-200">
        <CardContent className="p-8">
          <div className="text-center">
            <div className="mb-6">
              <h1 className="text-4xl md:text-5xl font-bold text-blue-800 mb-4">
                Yıldırım Mesleki ve Teknik Anadolu Lisesi
              </h1>
              <h2 className="text-2xl md:text-3xl font-semibold text-blue-600">
                Veli Yönlendirme Sistemi
              </h2>
            </div>
            
            <div className="my-10 flex justify-center">
              <div className="w-28 h-28 rounded-full bg-blue-100 flex items-center justify-center border-4 border-blue-200 shadow-inner">
                <img 
                  src="/school-logo.png" 
                  alt="Okul Logosu" 
                  className="w-20 h-20 object-contain"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg"; // Fallback to placeholder if logo not found
                    e.currentTarget.onerror = null;
                  }}
                />
              </div>
            </div>
            
            <p className="text-lg text-gray-700 mb-8">
              Veli yönlendirme sistemine hoş geldiniz. Sistemi başlatmak için aşağıdaki butona tıklayınız.
            </p>
            
            <div className="flex flex-col items-center space-y-6">
              <Button 
                onClick={() => {
                  if (audioEnabled) {
                    speakWelcome();
                  }
                  setTimeout(onStart, audioEnabled ? 2000 : 0);
                }}
                className="px-8 py-6 text-xl bg-blue-600 hover:bg-blue-700 transition-all shadow-lg rounded-full flex items-center"
              >
                <Play size={24} className="mr-2" />
                Sistemi Başlat
              </Button>
              
              <Button
                variant="outline"
                onClick={toggleAudio}
                className="flex items-center space-x-2 border border-blue-300"
              >
                <Volume2Icon size={18} className={audioEnabled ? "text-blue-700" : "text-gray-400"} />
                <span>{audioEnabled ? "Sesli Yönlendirme Açık" : "Sesli Yönlendirme Kapalı"}</span>
              </Button>
            </div>
            
            <div className="mt-10 text-sm text-gray-500">
              <p>© 2025 Yıldırım Mesleki ve Teknik Anadolu Lisesi</p>
              <p>Bu sistem görme ve işitme engelli kullanıcılar için erişilebilirlik desteklerine sahiptir</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StartScreen;
