
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import VoiceRecognition from './VoiceRecognition';

interface AttendanceFormProps {
  onSubmit: (name: string, grade: number) => void;
}

const AttendanceForm: React.FC<AttendanceFormProps> = ({ onSubmit }) => {
  const [name, setName] = useState('');
  const [grade, setGrade] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(true);
  const [stage, setStage] = useState<'name' | 'grade'>('name');
  
  const handleNameVoiceResult = (text: string) => {
    setIsListening(false);
    setName(text);
    setTimeout(() => {
      setStage('grade');
      setIsListening(true);
    }, 1000);
  };
  
  const handleGradeVoiceResult = (text: string) => {
    setIsListening(false);
    
    // Try to extract the grade from the spoken text
    const lowerText = text.toLowerCase();
    const grades = [9, 10, 11, 12];
    
    for (const g of grades) {
      if (lowerText.includes(`${g}`) || 
          lowerText.includes(`${g}. sınıf`)) {
        setGrade(g);
        
        // Submit the form after both name and grade are collected
        setTimeout(() => {
          onSubmit(name, g);
        }, 1000);
        
        return;
      }
    }
    
    // If no match is found, restart grade listening
    setTimeout(() => {
      setIsListening(true);
    }, 2000);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && grade) {
      onSubmit(name, grade);
    }
  };
  
  return (
    <Card className="w-full max-w-3xl bg-white/90 backdrop-blur-sm shadow-lg">
      <CardHeader className="bg-blue-600 text-white rounded-t-lg">
        <CardTitle className="text-2xl text-center">Devamsızlık Bilgileri</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Öğrenci Adı Soyadı</Label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                className="mt-1" 
                disabled={stage !== 'name'}
              />
            </div>
            
            {stage === 'grade' && (
              <div>
                <Label htmlFor="grade">Öğrenci Sınıfı</Label>
                <div className="grid grid-cols-4 gap-2 mt-1">
                  {[9, 10, 11, 12].map((g) => (
                    <Button
                      key={g}
                      type="button"
                      variant={grade === g ? "default" : "outline"}
                      className={`h-12 ${grade === g ? 'bg-blue-600' : 'border-blue-300'}`}
                      onClick={() => setGrade(g)}
                    >
                      {g}. Sınıf
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            {name && grade && (
              <Button type="submit" className="w-full mt-4 bg-blue-600 hover:bg-blue-700">
                Devamsızlık Bilgilerini Görüntüle
              </Button>
            )}
          </div>
        </form>
        
        <div className="mt-6">
          <VoiceRecognition 
            isListening={isListening} 
            onResult={stage === 'name' ? handleNameVoiceResult : handleGradeVoiceResult}
            prompt={stage === 'name' 
              ? "Lütfen öğrencinin adını ve soyadını söyleyin..." 
              : "Lütfen öğrencinin sınıfını söyleyin..."
            }
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default AttendanceForm;
