
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useTheme } from '@/context/ThemeContext';
import { speakText } from '@/utils/speechUtils';

interface RegistrationFormProps {
  onSubmit: () => void;
}

const RegistrationForm: React.FC<RegistrationFormProps> = ({ onSubmit }) => {
  const { isDarkMode } = useTheme();
  const [formSubmitted, setFormSubmitted] = useState(false);
  
  React.useEffect(() => {
    // Speak form instructions when component mounts
    setTimeout(() => {
      speakText("Lütfen kayıt formunu eksiksiz doldurunuz ve kaydı tamamla butonuna tıklayınız.", {
        rate: 0.9
      });
    }, 500);
  }, []);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formSubmitted) return;
    
    setFormSubmitted(true);
    
    speakText("Kayıt işleminiz tamamlandı. Teşekkür ederiz.", {
      rate: 0.9,
      onEnd: () => onSubmit()
    });
  };
  
  return (
    <Card className={`w-full mx-auto max-w-4xl ${isDarkMode ? 'bg-gray-800/90 dark:border-gray-700' : 'bg-white/90'} backdrop-blur-sm shadow-lg mt-8`}>
      <CardHeader className={`${isDarkMode ? 'bg-blue-800 border-blue-700' : 'bg-blue-600'} text-white rounded-t-lg`}>
        <CardTitle className="text-2xl text-center">9. Sınıf Kayıt Formu</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="studentName">Öğrenci Adı</Label>
              <Input id="studentName" placeholder="Adı" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="studentSurname">Öğrenci Soyadı</Label>
              <Input id="studentSurname" placeholder="Soyadı" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="studentId">T.C. Kimlik No</Label>
              <Input id="studentId" placeholder="11 haneli TC Kimlik No" maxLength={11} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthDate">Doğum Tarihi</Label>
              <Input id="birthDate" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parentName">Veli Adı</Label>
              <Input id="parentName" placeholder="Veli Adı" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parentSurname">Veli Soyadı</Label>
              <Input id="parentSurname" placeholder="Veli Soyadı" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input id="phone" placeholder="Telefon Numarası" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-posta</Label>
              <Input id="email" type="email" placeholder="E-posta Adresi" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Adres</Label>
              <Input id="address" placeholder="Ev Adresi" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="branch">Alan Seçimi</Label>
              <Select required>
                <SelectTrigger>
                  <SelectValue placeholder="Alan Seçiniz" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bilisim">Bilişim Teknolojileri</SelectItem>
                  <SelectItem value="elektrik">Elektrik-Elektronik</SelectItem>
                  <SelectItem value="muhasebe">Muhasebe ve Finansman</SelectItem>
                  <SelectItem value="pazarlama">Pazarlama ve Perakende</SelectItem>
                  <SelectItem value="makine">Makine Teknolojisi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="mt-6 flex items-center space-x-2">
            <Checkbox id="contractAccept" required />
            <Label htmlFor="contractAccept" className="text-sm">
              Veli-Öğrenci-Okul Sözleşmesini okudum ve kabul ediyorum
            </Label>
          </div>
          
          <CardFooter className="flex justify-end px-0 pt-6">
            <Button 
              type="submit"
              className={`${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
              disabled={formSubmitted}
            >
              {formSubmitted ? "Kaydediliyor..." : "Kaydı Tamamla"}
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
};

export default RegistrationForm;
