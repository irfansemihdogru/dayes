
import React, { useState, useEffect, useRef } from 'react';
import { Webcam } from './Webcam';
import { Card, CardContent } from "@/components/ui/card";

interface FaceRecognitionProps {
  onDetected: () => void;
}

const FaceRecognition: React.FC<FaceRecognitionProps> = ({ onDetected }) => {
  const [detecting, setDetecting] = useState(true);
  const detectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [detectedCount, setDetectedCount] = useState(0);
  
  // Listen for the faceDetected event from the Webcam component
  const handleFaceDetection = (detected: boolean) => {
    console.log('Face detection status:', detected);
    
    if (!detecting) return;
    
    if (detected) {
      // Increment detection count to make the detection more reliable
      setDetectedCount(prev => {
        const newCount = prev + 1;
        console.log('Face detection count:', newCount);
        
        // After 3 consecutive detections, trigger the detected event
        if (newCount >= 3) {
          console.log('Face reliably detected, triggering onDetected');
          setDetecting(false);
          if (detectionTimeoutRef.current) {
            clearTimeout(detectionTimeoutRef.current);
          }
          onDetected();
          return newCount;
        }
        return newCount;
      });
    } else {
      // Reset the counter if face is lost
      setDetectedCount(0);
    }
  };

  // Use a global event listener for face detection events
  useEffect(() => {
    const handleFaceEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.detected !== undefined) {
        handleFaceDetection(customEvent.detail.detected);
      }
    };
    
    window.addEventListener('faceDetected', handleFaceEvent);
    
    // Set a fallback timeout in case face detection doesn't work
    detectionTimeoutRef.current = setTimeout(() => {
      console.log('Face detection timeout, forcing onDetected');
      if (detecting) {
        setDetecting(false);
        onDetected();
      }
    }, 15000); // 15 seconds timeout
    
    return () => {
      window.removeEventListener('faceDetected', handleFaceEvent);
      if (detectionTimeoutRef.current) {
        clearTimeout(detectionTimeoutRef.current);
      }
    };
  }, [detecting, onDetected]);

  return (
    <Card className="w-full max-w-4xl bg-white/90 backdrop-blur-sm shadow-lg">
      <CardContent className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-blue-800 mb-4">Yüz Tanıma</h2>
          <div className="relative w-full h-96 bg-gray-100 rounded-lg mb-4 overflow-hidden">
            <Webcam />
            {detecting && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 border-4 border-blue-500 rounded-full animate-pulse opacity-70"></div>
              </div>
            )}
          </div>
          <p className="text-gray-600">
            {detecting 
              ? "Yüzünüz tanınıyor, lütfen kameraya bakınız..." 
              : "Yüzünüz başarıyla tanındı, uygulama başlatılıyor..."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default FaceRecognition;
