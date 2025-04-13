
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface GradeSelectionProps {
  onSelection: (grade: number) => void;
}

const grades = [9, 10, 11, 12];

const GradeSelection: React.FC<GradeSelectionProps> = ({ onSelection }) => {
  return (
    <Card className="w-full max-w-3xl bg-white/90 backdrop-blur-sm shadow-lg">
      <CardHeader className="bg-blue-600 text-white rounded-t-lg">
        <CardTitle className="text-2xl text-center mx-auto">Öğrenciniz Kaçıncı Sınıf?</CardTitle>
      </CardHeader>
      <CardContent className="p-6 flex flex-col items-center">
        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
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
      </CardContent>
    </Card>
  );
};

export default GradeSelection;
