
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from '@/context/ThemeContext';

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
];

const MainMenu: React.FC<MainMenuProps> = ({ onSelection }) => {
  const { isDarkMode } = useTheme();
  
  return (
    <Card className={`w-full max-w-4xl ${isDarkMode ? 'bg-gray-800/90 dark:border-gray-700' : 'bg-white/90'} backdrop-blur-sm shadow-lg`}>
      <CardHeader className={`${isDarkMode ? 'bg-blue-800 border-blue-700' : 'bg-blue-600'} text-white rounded-t-lg`}>
        <CardTitle className="text-2xl text-center">Hoşgeldiniz! Yapmak İstediğiniz İşlemi Kısaca Söyleyiniz</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {menuItems.map((item) => (
            <Button
              key={item.id}
              variant="outline"
              className={`h-16 text-lg ${
                isDarkMode 
                  ? 'border-blue-700 hover:bg-blue-900 hover:text-blue-200 text-blue-200' 
                  : 'border-blue-300 hover:bg-blue-50 hover:text-blue-800 text-blue-700'
              } transition-all`}
              onClick={() => onSelection(item.id)}
            >
              {item.name}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MainMenu;
