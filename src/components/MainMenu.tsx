
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import VoiceRecognition from './VoiceRecognition';

interface MenuItem {
  id: string;
  name: string;
}

interface MainMenuProps {
  onSelection: (selection: string) => void;
}

const menuItems: MenuItem[] = [
  { id: 'mesem', name: 'Mesem' },
  { id: 'usta-ogreticilik-belgesi', name: 'Usta Öğreticilik Belgesi' },
  { id: 'diploma', name: 'Diploma' },
  { id: 'disiplin', name: 'Disiplin' },
  { id: 'ogrenci-alma-izni', name: 'Öğrenciyi Okuldan Alma İzni' },
  { id: '9-sinif-kayit', name: '9.sınıf Kayıt Yönlendirme' },
  { id: 'devamsizlik', name: 'Devamsızlık' },
];

const MainMenu: React.FC<MainMenuProps> = ({ onSelection }) => {
  const [isListening, setIsListening] = useState(true);
  
  const handleVoiceResult = (text: string) => {
    setIsListening(false);
    
    // Try to match the spoken text with a menu item
    const lowerText = text.toLowerCase();
    
    for (const item of menuItems) {
      if (lowerText.includes(item.name.toLowerCase()) || 
          lowerText.includes(item.id.toLowerCase())) {
        onSelection(item.id);
        return;
      }
    }
    
    // If no match is found, restart listening
    setTimeout(() => {
      setIsListening(true);
    }, 2000);
  };
  
  return (
    <Card className="w-full max-w-4xl bg-white/90 backdrop-blur-sm shadow-lg">
      <CardHeader className="bg-blue-600 text-white rounded-t-lg">
        <CardTitle className="text-2xl text-center">Hoşgeldiniz! Yapmak İstediğiniz İşlemi Kısaca Söyleyiniz</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {menuItems.map((item) => (
            <Button
              key={item.id}
              variant="outline"
              className="h-16 text-lg border-blue-300 hover:bg-blue-50 hover:text-blue-800 transition-all"
              onClick={() => onSelection(item.id)}
            >
              {item.name}
            </Button>
          ))}
        </div>
        
        <VoiceRecognition 
          isListening={isListening} 
          onResult={handleVoiceResult}
          prompt="Lütfen işleminizi söyleyin..."
        />
      </CardContent>
    </Card>
  );
};

export default MainMenu;
