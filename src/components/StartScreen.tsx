
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Volume2Icon, Play, MoonIcon, SunIcon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

interface StartScreenProps {
  onStart: () => void;
  audioEnabled: boolean;
  toggleAudio: () => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart, audioEnabled, toggleAudio }) => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <div className="h-screen w-full flex items-center justify-center bg-gradient-to-b from-blue-100 to-white dark:from-blue-950 dark:to-gray-900 p-4 transition-colors duration-300">
      <Card className="w-full max-w-4xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-xl border border-blue-200 dark:border-blue-900">
        <CardContent className="p-8">
          <div className="text-center">
            <div className="mb-6">
              <h1 className="text-4xl md:text-5xl font-bold text-blue-800 dark:text-blue-300 mb-4">
                Yıldırım Mesleki ve Teknik Anadolu Lisesi
              </h1>
              <h2 className="text-2xl md:text-3xl font-semibold text-blue-600 dark:text-blue-400">
                Veli Yönlendirme Sistemi
              </h2>
            </div>
            
            <div className="my-10 flex justify-center">
              <div className="w-28 h-28 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center border-4 border-blue-200 dark:border-blue-800 shadow-inner">
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
            
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-8">
              Veli yönlendirme sistemine hoş geldiniz. Sistemi başlatmak için aşağıdaki butona tıklayınız.
            </p>
            
            <div className="flex flex-col items-center space-y-6">
              <Button 
                onClick={() => {
                  onStart();
                }}
                className="px-8 py-6 text-xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 transition-all shadow-lg rounded-full flex items-center"
              >
                <Play size={24} className="mr-2" />
                Sistemi Başlat
              </Button>
              
              <div className="flex space-x-4">
                <Button
                  variant="outline"
                  onClick={toggleAudio}
                  className="flex items-center space-x-2 border border-blue-300 dark:border-blue-700 dark:text-gray-200"
                >
                  <Volume2Icon size={18} className={audioEnabled ? "text-blue-700 dark:text-blue-400" : "text-gray-400"} />
                  <span>{audioEnabled ? "Sesli Yönlendirme Açık" : "Sesli Yönlendirme Kapalı"}</span>
                </Button>
                
                <Button
                  variant="outline"
                  onClick={toggleTheme}
                  className="flex items-center space-x-2 border border-blue-300 dark:border-blue-700 dark:text-gray-200"
                >
                  {theme === 'light' ? (
                    <>
                      <MoonIcon size={18} className="text-blue-700 dark:text-blue-400" />
                      <span>Karanlık Mod</span>
                    </>
                  ) : (
                    <>
                      <SunIcon size={18} className="text-yellow-500" />
                      <span>Aydınlık Mod</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            <div className="mt-10 text-sm text-gray-500 dark:text-gray-400">
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
