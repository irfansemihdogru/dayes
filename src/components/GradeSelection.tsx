
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/context/ThemeContext";

interface GradeSelectionProps {
  onSelection: (grade: number) => void;
}

const grades = [9, 10, 11, 12];

const GradeSelection: React.FC<GradeSelectionProps> = ({ onSelection }) => {
  const { isDarkMode } = useTheme();

  return (
    <Card className={`w-full max-w-3xl mx-auto ${isDarkMode ? 'bg-gray-800/95 border-gray-700' : 'bg-white/95'} backdrop-blur-sm shadow-lg transition-all duration-300`}>
      <CardHeader className={`${isDarkMode ? 'bg-blue-900' : 'bg-blue-600'} text-white rounded-t-lg py-4`}>
        <CardTitle className="text-2xl text-center font-bold">Öğrenciniz Kaçıncı Sınıf?</CardTitle>
      </CardHeader>
      <CardContent className="p-8 flex flex-col items-center">
        <div className="grid grid-cols-2 gap-6 w-full max-w-md mx-auto">
          {grades.map((grade) => (
            <Button
              key={grade}
              variant={isDarkMode ? "default" : "outline"}
              size="lg"
              className={`h-20 text-xl font-bold ${
                isDarkMode 
                  ? 'bg-blue-800 hover:bg-blue-700 text-white'
                  : 'border-blue-300 hover:bg-blue-50 hover:text-blue-800'
              } transition-all shadow hover:shadow-md`}
              onClick={() => onSelection(grade)}
            >
              {grade}. Sınıf
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default GradeSelection;
