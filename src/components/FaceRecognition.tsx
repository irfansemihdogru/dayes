
import React, { useState, useEffect } from 'react';
import { Webcam } from './Webcam';
import { Card, CardContent } from "@/components/ui/card";

interface FaceRecognitionProps {
  onDetected: () => void;
}

const FaceRecognition: React.FC<FaceRecognitionProps> = ({ onDetected }) => {
  const [detecting, setDetecting] = useState(true);
  
  useEffect(() => {
    // In a real implementation, this would use a facial recognition library
    // For this demo, we'll just simulate detection after 3 seconds
    const timer = setTimeout(() => {
      if (detecting) {
        setDetecting(false);
        onDetected();
      }
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [detecting, onDetected]);

  return (
    <Card className="w-full max-w-3xl bg-white/80 backdrop-blur-sm shadow-lg">
      <CardContent className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-blue-800 mb-4">Yüz Tanıma</h2>
          <div className="relative w-full h-64 bg-gray-200 rounded-lg mb-4 overflow-hidden">
            {detecting ? (
              <>
                <Webcam />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 border-4 border-blue-500 rounded-full animate-pulse opacity-70"></div>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-blue-100">
                <p className="text-xl text-blue-800">Yüz tanındı!</p>
              </div>
            )}
          </div>
          <p className="text-gray-600">
            {detecting 
              ? "Yüzünüz tanınıyor, lütfen bekleyin..." 
              : "Yüzünüz başarıyla tanındı, uygulama başlatılıyor..."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default FaceRecognition;
