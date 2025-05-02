
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTheme } from '@/context/ThemeContext';
import { speakText } from '@/utils/speechUtils';

interface DevamsizlikFormProps {
  onSubmit: (name: string, surname: string) => void;
}

const DevamsizlikForm: React.FC<DevamsizlikFormProps> = ({ onSubmit }) => {
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const { isDarkMode } = useTheme();
  
  React.useEffect(() => {
    // Announce the prompt for name and surname input
    setTimeout(() => {
      speakText('Lütfen öğrencinin adını ve soyadını söyleyiniz veya giriniz.');
    }, 500);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (name.trim() && surname.trim()) {
      speakText(`${name} ${surname} öğrencisinin devamsızlık bilgileri getiriliyor`, {
        onEnd: () => onSubmit(name, surname)
      });
    }
  };

  return (
    <Card className={`w-full mx-auto max-w-2xl ${isDarkMode ? 'bg-gray-800/90 dark:border-gray-700' : 'bg-white/90'} backdrop-blur-sm shadow-lg`}>
      <CardHeader className={`${isDarkMode ? 'bg-blue-800 border-blue-700' : 'bg-blue-600'} text-white rounded-t-lg`}>
        <CardTitle className="text-2xl text-center">Devamsızlık Bilgileri Sorgulama</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className={`${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Öğrenci Adı</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} focus:ring-blue-500 focus:border-blue-500`}
                placeholder="Adı giriniz"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="surname" className={`${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Öğrenci Soyadı</Label>
              <Input
                id="surname"
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
                className={`${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} focus:ring-blue-500 focus:border-blue-500`}
                placeholder="Soyadı giriniz"
                required
              />
            </div>
          </div>
          <CardFooter className="px-0 pt-6 flex justify-end">
            <Button 
              type="submit"
              className={`${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
              disabled={!name.trim() || !surname.trim()}
            >
              Sorgula
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
};

export default DevamsizlikForm;
