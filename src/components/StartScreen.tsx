
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Landmark, Moon, Sun, Volume2, VolumeX } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

interface StartScreenProps {
  onStart: () => void;
  audioEnabled: boolean;
  toggleAudio: () => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart, audioEnabled, toggleAudio }) => {
  const { theme, toggleTheme, isDarkMode } = useTheme();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-blue-50 to-white dark:from-blue-950 dark:to-gray-900 transition-colors duration-300">
      <div className="w-full max-w-4xl">
        <Card className={`${isDarkMode ? 'bg-gray-800/90 border-gray-700' : 'bg-white/90'} backdrop-blur-sm shadow-xl`}>
          <CardHeader className={`${isDarkMode ? 'bg-blue-800 border-blue-700' : 'bg-blue-600'} text-white rounded-t-lg text-center py-8`}>
            <div className="flex justify-center mb-4">
              <img 
                src="https://i.hizliresim.com/86akbt6.png" 
                alt="Yıldırım Mesleki ve Teknik Anadolu Lisesi Logo" 
                className="h-24 w-auto"
                aria-label="Okul logosu" 
              />
            </div>
            <CardTitle className="text-3xl font-bold">
              Yıldırım Mesleki ve Teknik Anadolu Lisesi
            </CardTitle>
            <p className="text-xl mt-2 text-blue-100">Veli Yönlendirme Sistemi</p>
          </CardHeader>
          <CardContent className={`p-8 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            <div className="text-center mb-8">
              <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>Hoş Geldiniz</h2>
              <p className="text-lg">
                Veli yönlendirme sistemine hoş geldiniz. Sistemi başlatmak için aşağıdaki butona tıklayınız.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-8">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="dark-mode" 
                  checked={isDarkMode} 
                  onCheckedChange={toggleTheme}
                  className="data-[state=checked]:bg-blue-600"
                />
                <Label htmlFor="dark-mode" className="flex items-center cursor-pointer">
                  {isDarkMode ? (
                    <Moon size={20} className="mr-2 text-blue-300" />
                  ) : (
                    <Sun size={20} className="mr-2 text-amber-500" />
                  )}
                  {isDarkMode ? 'Koyu Mod' : 'Aydınlık Mod'}
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch 
                  id="audio-toggle" 
                  checked={audioEnabled} 
                  onCheckedChange={toggleAudio}
                  className="data-[state=checked]:bg-green-600"
                />
                <Label htmlFor="audio-toggle" className="flex items-center cursor-pointer">
                  {audioEnabled ? (
                    <Volume2 size={20} className="mr-2 text-green-500" />
                  ) : (
                    <VolumeX size={20} className="mr-2 text-gray-500" />
                  )}
                  {audioEnabled ? 'Sesli Yönlendirme Açık' : 'Sesli Yönlendirme Kapalı'}
                </Label>
              </div>
            </div>

            <div className="flex justify-center mt-6">
              <Button
                onClick={onStart}
                size="lg"
                className={`text-xl py-6 px-8 ${
                  isDarkMode 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                Sistemi Başlat
              </Button>
            </div>
            
            <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
              <p>Bu sistem görme ve işitme engelli kullanıcılar için erişilebilirlik desteklerine sahiptir</p>
              <p className="mt-2">© 2025 Yıldırım Mesleki ve Teknik Anadolu Lisesi</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StartScreen;
