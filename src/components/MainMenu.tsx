import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from '@/context/ThemeContext';
import { speakText } from '@/utils/speechUtils';

interface MenuItem {
  id: string;
  name: string;
}

interface MainMenuProps {
  onSelection: (selection: string) => void;
  stopMicrophone?: () => void; // ✅ Yeni prop eklendi
}

const menuItems: MenuItem[] = [
  { id: '9-sinif-kayit', name: '1-9.Sınıf Kayıt İşlemleri' },
  { id: 'ogrenci-alma-izni', name: '2-Öğrenci İzin İşlemleri' },
  { id: 'mesem', name: '3-Mesem Öğrenci İşlemleri' },
  { id: 'devamsizlik', name: '4-Devamsızlık İşlemleri' },
  { id: 'disiplin', name: '5-Disiplin İşlemleri' },
  { id: 'diploma', name: '6-Diploma İşlemleri' },
];

// Mikrofonun anında kapatılacağı işlemler
const disableMicrophoneForOperations = ['9-sinif-kayit', 'ogrenci-alma-izni', 'mesem', 'disiplin', 'diploma'];

const MainMenu: React.FC<MainMenuProps> = ({ onSelection, stopMicrophone }) => {
  const { isDarkMode } = useTheme();

  const handleMenuSelection = (itemId: string) => {
    const selectedItem = menuItems.find(item => item.id === itemId);
    const itemName = selectedItem?.name || '';

    if (stopMicrophone) stopMicrophone(); // ✅ Mikrofonu kapat

    if (disableMicrophoneForOperations.includes(itemId)) {
      speakText(`${itemName} seçildi`);
      onSelection(itemId);
    } else {
      speakText(`${itemName} seçildi`, {
        onEnd: () => onSelection(itemId)
      });
    }
  };

  return (
    <Card className={`w-full mx-auto max-w-4xl ${isDarkMode ? 'bg-gray-800/90 dark:border-gray-700' : 'bg-white/90'} backdrop-blur-sm shadow-lg`}>
      <CardHeader className={`${isDarkMode ? 'bg-blue-800 border-blue-700' : 'bg-blue-600'} text-white rounded-t-lg`}>
        <CardTitle className="text-2xl text-center">Yapmak İstediğiniz İşlemi Seçin Veya Sesli Olarak Söyleyin</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* İlk üç buton */}
          <div className="space-y-4">
            {menuItems.slice(0, 3).map((item) => (
              <Button
                key={item.id}
                variant="outline"
                className={`w-full h-16 text-lg ${
                  isDarkMode 
                    ? 'bg-gray-800/80 border-blue-700 hover:bg-blue-900 hover:text-blue-200 text-blue-200' 
                    : 'border-blue-300 hover:bg-blue-50 hover:text-blue-800 text-blue-700'
                } transition-all focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800`}
                onClick={() => handleMenuSelection(item.id)}
                aria-label={`${item.name} işlemini seçin`}
              >
                {item.name}
              </Button>
            ))}
          </div>

          {/* Son üç buton */}
          <div className="space-y-4">
            {menuItems.slice(3).map((item) => (
              <Button
                key={item.id}
                variant="outline"
                className={`w-full h-16 text-lg ${
                  isDarkMode 
                    ? 'bg-gray-800/80 border-blue-700 hover:bg-blue-900 hover:text-blue-200 text-blue-200' 
                    : 'border-blue-300 hover:bg-blue-50 hover:text-blue-800 text-blue-700'
                } transition-all focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800`}
                onClick={() => handleMenuSelection(item.id)}
                aria-label={`${item.name} işlemini seçin`}
              >
                {item.name}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MainMenu;
