
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import VoiceRecognition from './VoiceRecognition';

interface GradeSelectionProps {
  onSelection: (grade: number) => void;
}

const grades = [9, 10, 11, 12];

const GradeSelection: React.FC<GradeSelectionProps> = ({ onSelection }) => {
  const [isListening, setIsListening] = useState(true);
  
  const handleVoiceResult = (text: string) => {
    setIsListening(false);
    
    // Try to extract the grade from the spoken text
    const lowerText = text.toLowerCase();
    
    for (const grade of grades) {
      if (lowerText.includes(`${grade}`) || 
          lowerText.includes(`${grade}. sınıf`)) {
        onSelection(grade);
        return;
      }
    }
    
    // If no match is found, restart listening
    setTimeout(() => {
      setIsListening(true);
    }, 2000);
  };
  
  return (
    <Card className="w-full max-w-3xl bg-white/90 backdrop-blur-sm shadow-lg">
      <CardHeader className="bg-blue-600 text-white rounded-t-lg">
        <CardTitle className="text-2xl text-center">Öğrenciniz Kaçıncı Sınıf?</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          {grades.map((grade) => (
            <Button
              key={grade}
              variant="outline"
              className="h-16 text-xl border-blue-300 hover:bg-blue-50 hover:text-blue-800 transition-all"
              onClick={() => onSelection(grade)}
            >
              {grade}. Sınıf
            </Button>
          ))}
        </div>
        
        <VoiceRecognition 
          isListening={isListening} 
          onResult={handleVoiceResult}
          prompt="Lütfen öğrencinizin sınıfını söyleyin..."
        />
      </CardContent>
    </Card>
  );
};

export default GradeSelection;
